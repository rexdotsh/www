import { DurableObject } from "cloudflare:workers";
import {
  ago,
  type Beacon,
  GUESTBOOK_LIMITS,
  type GuestbookEntry,
  type SiteStats,
} from "@/lib/stats";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const ONLINE_WINDOW = 5 * MINUTE;
const VISITS_KEEP = 8 * DAY;
const READS_KEEP = 90 * DAY;
const PRUNE_EVERY = 25;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS paths (path TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS visits (ts INTEGER NOT NULL, visitor TEXT NOT NULL, city TEXT NOT NULL, path TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS visits_ts ON visits (ts);
  CREATE TABLE IF NOT EXISTS reads (ts INTEGER NOT NULL, path TEXT NOT NULL, depth INTEGER NOT NULL, seconds INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS reads_ts ON reads (ts);
  CREATE TABLE IF NOT EXISTS guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    city TEXT NOT NULL,
    who TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0
  );
`;

const month = (ts: number) => new Date(ts).toISOString().slice(0, 7);
const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Math.round(n)));

export interface Signature {
  city: string;
  message: string;
  name: string;
  who: string[];
}

export type SignResult =
  | { ok: true; entry: GuestbookEntry }
  | { ok: false; reason: "cooldown" | "empty" };

export class Room extends DurableObject {
  private readonly sql: SqlStorage;
  private writes = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(SCHEMA);
  }

  record(beacon: Beacon, city: string) {
    const now = Date.now();
    if (beacon.type === "view") {
      this.sql.exec(
        "INSERT INTO visits (ts, visitor, city, path) VALUES (?, ?, ?, ?)",
        now,
        beacon.visitor,
        city,
        beacon.path
      );
      this.sql.exec(
        "INSERT INTO paths (path, views) VALUES (?, 1) ON CONFLICT(path) DO UPDATE SET views = views + 1",
        beacon.path
      );
      this.bump("total");
    } else if (beacon.type === "leave") {
      this.sql.exec(
        "INSERT INTO reads (ts, path, depth, seconds) VALUES (?, ?, ?, ?)",
        now,
        beacon.path,
        clamp(beacon.depth, 100),
        clamp(beacon.seconds, 3600)
      );
    } else {
      this.bump(`hi:${month(now)}`);
    }
    this.writes += 1;
    if (this.writes % PRUNE_EVERY === 0) {
      this.sql.exec("DELETE FROM visits WHERE ts < ?", now - VISITS_KEEP);
      this.sql.exec("DELETE FROM reads WHERE ts < ?", now - READS_KEEP);
    }
  }

  stats(): SiteStats {
    const now = Date.now();
    const paths: Record<string, number> = {};
    for (const row of this.sql
      .exec<{ path: string; views: number }>("SELECT path, views FROM paths")
      .toArray()) {
      paths[row.path] = row.views;
    }
    const counts = this.first<{ online: number; today: number; week: number }>(
      `SELECT
        count(DISTINCT CASE WHEN ts > ? THEN visitor END) AS online,
        sum(ts > ?) AS today,
        count(*) AS week
      FROM visits WHERE ts > ?`,
      now - ONLINE_WINDOW,
      now - DAY,
      now - 7 * DAY
    );
    return {
      online: counts?.online ?? 0,
      today: counts?.today ?? 0,
      week: counts?.week ?? 0,
      total: this.count("total"),
      recent: this.sql
        .exec<{ city: string; path: string; ts: number }>(
          "SELECT city, path, max(ts) AS ts FROM visits GROUP BY visitor ORDER BY ts DESC LIMIT 5"
        )
        .toArray()
        .map((row) => ({
          place: row.city,
          path: row.path,
          ago: ago(row.ts, now),
        })),
      paths,
      hi: this.count(`hi:${month(now)}`),
      signed:
        this.first<{ n: number }>(
          "SELECT count(*) AS n FROM guestbook WHERE hidden = 0"
        )?.n ?? 0,
      guestbook: this.sql
        .exec<{
          city: string;
          id: number;
          message: string;
          name: string;
          ts: number;
        }>(
          "SELECT id, ts, name, message, city FROM guestbook WHERE hidden = 0 ORDER BY ts DESC LIMIT ?",
          GUESTBOOK_LIMITS.shown
        )
        .toArray()
        .map((row) => ({
          id: row.id,
          name: row.name,
          message: row.message,
          place: row.city,
          ago: ago(row.ts, now),
        })),
    };
  }

  sign(input: Signature): SignResult {
    if (!input.message) {
      return { ok: false, reason: "empty" };
    }
    const now = Date.now();
    const name = input.name || "anonymous";
    const marks = input.who.map(() => "?").join(", ");
    const seen = this.first<{ n: number }>(
      `SELECT count(*) AS n FROM guestbook WHERE ts > ? AND who IN (${marks})`,
      now - GUESTBOOK_LIMITS.cooldownMs,
      ...input.who
    );
    if (seen && seen.n > 0) {
      return { ok: false, reason: "cooldown" };
    }
    const row = this.first<{ id: number }>(
      "INSERT INTO guestbook (ts, name, message, city, who) VALUES (?, ?, ?, ?, ?) RETURNING id",
      now,
      name,
      input.message,
      input.city,
      input.who[0] ?? ""
    );
    return {
      ok: true,
      entry: {
        id: row?.id ?? 0,
        name,
        message: input.message,
        place: input.city,
        ago: "just now",
      },
    };
  }

  hide(id: number) {
    this.sql.exec("UPDATE guestbook SET hidden = 1 WHERE id = ?", id);
  }

  private first<T extends Record<string, SqlStorageValue>>(
    query: string,
    ...bindings: SqlStorageValue[]
  ) {
    const [row] = this.sql.exec<T>(query, ...bindings).toArray();
    return row;
  }

  private bump(key: string) {
    this.sql.exec(
      "INSERT INTO counters (key, n) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET n = n + 1",
      key
    );
  }

  private count(key: string) {
    return (
      this.first<{ n: number }>("SELECT n FROM counters WHERE key = ?", key)
        ?.n ?? 0
    );
  }
}
