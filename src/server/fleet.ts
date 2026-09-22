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

// One row per host with the history rolled into it: one UPDATE per sample,
// nothing to prune. Ring lengths are the page's windows.
const SPARK = 48;
const BEATS = 90;
const DAYS = 30;
const MINUTE = 60_000;
const QUIET_AFTER = 3 * MINUTE;

interface Day {
  d: number;
  n: number;
  ok: number;
}

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
  svc: Record<string, { mem: number; strip: number[]; days: Day[] }>;
}

const push = <T>(ring: T[], value: T, size: number) =>
  [...ring, value].slice(-size);

const dayOf = (ts: number) => Math.floor(ts / 86_400_000);

export class FleetStore extends DurableObject {
  private readonly sql: SqlStorage;
  private snapshotCache: Fleet | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS hosts (id TEXT PRIMARY KEY, blob TEXT NOT NULL)"
    );
  }

  ingest(host: string, sample: Sample, ts: number) {
    const prev = this.row(host);
    const day = dayOf(ts);
    const svc: Row["svc"] = {};
    for (const s of SERVICES) {
      if (s.host !== host) continue;
      const names = Array.isArray(s.container) ? s.container : [s.container];
      const found = sample.containers.filter((c) => names.includes(c.n));
      const up =
        found.length === names.length && found.every((c) => c.s === "running");
      const old = prev?.svc[s.id];
      const days = old?.days ?? [];
      const last = days.at(-1);
      const today =
        last?.d === day
          ? { ...last, ok: last.ok + (up ? 1 : 0), n: last.n + 1 }
          : { d: day, ok: up ? 1 : 0, n: 1 };
      svc[s.id] = {
        mem: found.reduce((sum, c) => sum + (c.m ?? 0), 0),
        strip: push(old?.strip ?? [], up ? 1 : 0, BEATS),
        days: push(last?.d === day ? days.slice(0, -1) : days, today, DAYS),
      };
    }
    const row: Row = {
      boot: sample.boot,
      containers: sample.containers.length,
      cpu: sample.cpu,
      cpus: sample.cpus,
      disk: sample.disk,
      load: sample.load,
      mem: sample.mem,
      os: sample.os,
      seen: ts,
      spark: push(prev?.spark ?? [], sample.cpu, SPARK),
      beats: push(prev?.beats ?? [], 1, BEATS),
      svc,
    };
    this.sql.exec(
      "INSERT INTO hosts (id, blob) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET blob = excluded.blob",
      host,
      JSON.stringify(row)
    );
    this.snapshotCache = null;
  }

  snapshot(): Fleet {
    if (this.snapshotCache) {
      return this.snapshotCache;
    }
    const now = Date.now();
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
      // Missed minutes since the last sample show as gaps.
      const missed = row
        ? Math.min(BEATS, Math.floor((now - row.seen) / MINUTE))
        : BEATS;
      measuredAt = Math.max(measuredAt, row?.seen ?? 0);
      hosts.push({
        id,
        role: meta.role,
        spec: row
          ? `${row.os} · ${row.cpus} vcpu · ${gb(row.mem[1])} gb · ${meta.spec}`
          : meta.spec,
        health,
        cpu: silent ? 0 : (row?.cpu ?? 0),
        cpuSpark: pad(row?.spark ?? [], SPARK),
        load: silent ? [0, 0, 0] : (row?.load ?? [0, 0, 0]),
        memUsed: row?.mem[0] ?? 0,
        memTotal: row?.mem[1] ?? 0,
        diskUsed: (row?.disk[0] ?? 0) / 1024,
        diskTotal: (row?.disk[1] ?? 0) / 1024,
        upSince: silent ? 0 : (row?.boot ?? 0) * 1000,
        lastSeen: row?.seen ?? 0,
        beats: [
          ...pad(row?.beats ?? [], BEATS - missed).map(cell(health)),
          ...Array.from({ length: missed }, (): Health => health),
        ].slice(-BEATS),
        containers: row?.containers ?? 0,
      });

      if (meta.private) continue;
      for (const s of SERVICES) {
        if (s.host !== id) continue;
        const v = row?.svc[s.id];
        const up = !silent && v?.strip.at(-1) === 1;
        const totals = (v?.days ?? []).reduce(
          (acc, d) => ({ ok: acc.ok + d.ok, n: acc.n + d.n }),
          { ok: 0, n: 0 }
        );
        services.push({
          id: s.id,
          blurb: s.blurb,
          host: id,
          health: silent ? health : up ? "up" : "down",
          mem: up ? (v?.mem ?? 0) : 0,
          strip: [
            ...pad(v?.strip ?? [], BEATS - missed).map(cell("down")),
            ...Array.from({ length: missed }, (): Health => health),
          ].slice(-BEATS),
          uptime30: totals.n ? (totals.ok / totals.n) * 100 : 0,
        });
      }
    }

    const snapshot: Fleet = { hosts, services, measuredAt };
    this.snapshotCache = snapshot;
    return snapshot;
  }

  private row(host: string): Row | null {
    const [r] = this.sql
      .exec<{ blob: string }>("SELECT blob FROM hosts WHERE id = ?", host)
      .toArray();
    return r ? (JSON.parse(r.blob) as Row) : null;
  }
}

const gb = (mb: number) => Math.round(mb / 1024);

// Left-pads a ring with -1 (no data yet) so young hosts still fill the strip.
const pad = (ring: number[], size: number) =>
  size <= 0
    ? []
    : [
        ...Array.from({ length: Math.max(0, size - ring.length) }, () => -1),
        ...ring,
      ].slice(-size);

const cell =
  (bad: Health) =>
  (b: number): Health =>
    b === 1 ? "up" : b === 0 ? bad : "none";
