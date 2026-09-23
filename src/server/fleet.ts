import { DurableObject } from "cloudflare:workers";
import {
  type Fleet,
  type Health,
  HOSTS,
  type Host,
  type Sample,
  SERVICES,
  type Service,
} from "@/lib/fleet";

// One row per host with its history rolled in as rings: one UPDATE per
// sample, nothing to prune. Cells are 1 up, 0 down, -1 no data.
const SPARK = 48;
const BEATS = 90;
const DAYS = 30;
const MINUTE = 60_000;
const QUIET_AFTER = 3 * MINUTE;
const CACHE_MS = 30_000;

interface Row {
  beats: number[];
  boot: number;
  containers: number;
  cpu: number;
  cpus: number;
  disk: [number, number];
  load: [number, number, number];
  mem: [number, number];
  os: string;
  seen: number;
  spark: number[];
  svc: Record<
    string,
    { mem: number; strip: number[]; days: [number, number, number][] }
  >;
}

const push = <T>(ring: T[] | undefined, value: T, size: number) =>
  [...(ring ?? []), value].slice(-size);

const pad = (ring: number[], size: number) =>
  size > 0
    ? [...new Array(Math.max(0, size - ring.length)).fill(-1), ...ring].slice(
        -size
      )
    : [];

const cells = (
  ring: number[],
  size: number,
  bad: Health,
  tail: Health,
  missed: number
) => [
  ...pad(ring, size - missed).map(
    (b): Health => (b === 1 ? "up" : b === 0 ? bad : "none")
  ),
  ...new Array(missed).fill(tail),
];

export class FleetStore extends DurableObject {
  private readonly sql: SqlStorage;
  private cache: { at: number; fleet: Fleet } | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS hosts (id TEXT PRIMARY KEY, blob TEXT NOT NULL)"
    );
  }

  // Returns false for a stale or replayed sample.
  ingest(host: string, sample: Sample, ts: number) {
    const prev = this.row(host);
    if (prev && ts <= prev.seen) return false;
    const day = Math.floor(ts / 86_400_000);
    const svc: Row["svc"] = {};
    for (const s of SERVICES) {
      if (s.host !== host) continue;
      const names = [s.container].flat();
      const found = sample.containers.filter((c) => names.includes(c.n));
      const up =
        found.length === names.length && found.every((c) => c.s === "running")
          ? 1
          : 0;
      const old = prev?.svc[s.id];
      const days = old?.days ?? [];
      const last = days.at(-1);
      const today: [number, number, number] =
        last?.[0] === day ? [day, last[1] + up, last[2] + 1] : [day, up, 1];
      svc[s.id] = {
        mem: found.reduce((sum, c) => sum + (c.m ?? 0), 0),
        strip: push(old?.strip, up, BEATS),
        days: push(last?.[0] === day ? days.slice(0, -1) : days, today, DAYS),
      };
    }
    const row: Row = {
      ...sample,
      containers: sample.containers.length,
      seen: ts,
      spark: push(prev?.spark, sample.cpu, SPARK),
      beats: push(prev?.beats, 1, BEATS),
      svc,
    };
    this.sql.exec(
      "INSERT INTO hosts (id, blob) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET blob = excluded.blob",
      host,
      JSON.stringify(row)
    );
    this.cache = null;
    return true;
  }

  snapshot(): Fleet {
    const now = Date.now();
    if (this.cache && now - this.cache.at < CACHE_MS) return this.cache.fleet;
    const rows = new Map(
      this.sql
        .exec<{ id: string; blob: string }>("SELECT id, blob FROM hosts")
        .toArray()
        .map((r) => [r.id, JSON.parse(r.blob) as Row])
    );
    const hosts: Host[] = [];
    const services: Service[] = [];
    let measuredAt = 0;

    for (const [id, meta] of Object.entries(HOSTS)) {
      const row = rows.get(id);
      const silent = !row || now - row.seen > QUIET_AFTER;
      const health: Health = silent
        ? meta.intermittent
          ? "off"
          : "down"
        : "up";
      const missed = row
        ? Math.min(BEATS, Math.max(0, Math.floor((now - row.seen) / MINUTE)))
        : BEATS;
      measuredAt = Math.max(measuredAt, row?.seen ?? 0);
      hosts.push({
        id,
        role: meta.role,
        spec: row
          ? `${row.os} · ${row.cpus} vcpu · ${Math.round(row.mem[1] / 1024)} gb · ${meta.spec}`
          : meta.spec,
        health,
        cpu: silent ? 0 : (row?.cpu ?? 0),
        cpuSpark: pad(row?.spark ?? [], SPARK).map((v) => Math.max(0, v)),
        load: silent ? [0, 0, 0] : (row?.load ?? [0, 0, 0]),
        memUsed: row?.mem[0] ?? 0,
        memTotal: row?.mem[1] ?? 0,
        diskUsed: (row?.disk[0] ?? 0) / 1024,
        diskTotal: (row?.disk[1] ?? 0) / 1024,
        upSince: silent ? 0 : (row?.boot ?? 0) * 1000,
        lastSeen: row?.seen ?? 0,
        beats: cells(row?.beats ?? [], BEATS, health, health, missed),
        containers: row?.containers ?? 0,
      });
      if (meta.private) continue;

      for (const s of SERVICES) {
        if (s.host !== id) continue;
        const v = row?.svc[s.id];
        const up = !silent && v?.strip.at(-1) === 1;
        const [ok, n] = (v?.days ?? []).reduce(
          ([a, b], [, o, t]) => [a + o, b + t],
          [0, 0]
        );
        services.push({
          id: s.id,
          blurb: s.blurb,
          host: id,
          health: silent ? health : up ? "up" : "down",
          mem: up ? (v?.mem ?? 0) : 0,
          strip: cells(v?.strip ?? [], BEATS, "down", health, missed),
          uptime30: n ? (ok / n) * 100 : 0,
        });
      }
    }
    const fleet: Fleet = { hosts, services, measuredAt };
    this.cache = { at: now, fleet };
    return fleet;
  }

  private row(host: string) {
    const [r] = this.sql
      .exec<{ blob: string }>("SELECT blob FROM hosts WHERE id = ?", host)
      .toArray();
    return r ? (JSON.parse(r.blob) as Row) : null;
  }
}
