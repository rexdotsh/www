// Shapes for the workshop (/status). Mock data for now; the Fleet DO will
// return the same `Fleet` once the agents are reporting.

// `off` is a machine that's meant to be off (the desk); `down` is one that isn't.
export type Health = "up" | "slow" | "down" | "off";

export interface Host {
  /** last 90 heartbeats, one a minute */
  beats: Health[];
  containers: number;
  cpu: number;
  cpuSpark: number[];
  diskTotal: number;
  /** ~30d of daily disk-used readings, GB */
  diskTrend: number[];
  diskUsed: number;
  health: Health;
  id: string;
  lastSeen: number;
  load: [number, number, number];
  memSpark: number[];
  memTotal: number;
  memUsed: number;
  /** what it's for, one line */
  role: string;
  /** os @ where, shape not address */
  spec: string;
  swapTotal: number;
  swapUsed: number;
  upSince: number;
}

export interface Service {
  /** what it is, prose */
  blurb: string;
  health: Health;
  host: string;
  id: string;
  latency: number;
  name: string;
  /** last 90 checks from outside, oldest first */
  strip: Health[];
  uptime30: number;
  /** who it's for */
  who: string;
}

export interface Incident {
  /** seconds */
  duration: number;
  note: string;
  resolved: boolean;
  service: string;
  ts: number;
}

export interface Fleet {
  hosts: Host[];
  incidents: Incident[];
  measuredAt: number;
  mock?: boolean;
  services: Service[];
  /** ms, how long the sweep took */
  sweep: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Deterministic noise so SSR and the client agree. A small LCG; the modulus
// keeps every value under 2^53 so no bit-twiddling is needed.
const MOD = 2_147_483_647;
const rng = (seed: number) => {
  let s = (seed + 1) % MOD;
  return () => {
    s = (s * 48_271) % MOD;
    return s / MOD;
  };
};

const series = (seed: number, n: number, base: number, wobble: number) => {
  const next = rng(seed);
  let v = base;
  return Array.from({ length: n }, () => {
    v += (next() - 0.5) * wobble;
    v = Math.max(0, Math.min(100, v * 0.92 + base * 0.08));
    return Math.round(v);
  });
};

const climb = (seed: number, n: number, from: number, to: number) => {
  const next = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return (
      Math.round((from + (to - from) * t + (next() - 0.5) * 1.4) * 10) / 10
    );
  });
};

const strip = (n: number, blips: number[]): Health[] => {
  const out: Health[] = Array.from({ length: n }, () => "up");
  for (const i of blips) {
    out[i] = "down";
    if (out[i + 1]) out[i + 1] = "slow";
  }
  return out;
};

export const fmtGb = (gb: number) => {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)}t`;
  if (gb >= 100) return `${Math.round(gb)}g`;
  return `${gb.toFixed(1)}g`;
};

export const fmtMb = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)}g` : `${Math.round(mb)}m`;

export const fmtUptime = (since: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - since) / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const fmtDuration = (s: number) => {
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

export const pct = (used: number, total: number) =>
  total === 0 ? 0 : Math.round((used / total) * 100);

export const mockFleet = (now = Date.now()): Fleet => ({
  mock: true,
  measuredAt: now - 12_000,
  sweep: 641,
  hosts: [
    {
      id: "media",
      role: "films, shows, music. the busy one",
      spec: "ubuntu 24 · 4 vcpu · 16 gb · singapore",
      cpu: 41,
      cpuSpark: series(11, 48, 38, 22),
      memUsed: 9870,
      memTotal: 15_990,
      memSpark: series(12, 48, 61, 6),
      swapUsed: 412,
      swapTotal: 4096,
      diskUsed: 1318,
      diskTotal: 1863,
      diskTrend: climb(13, 30, 1140, 1318),
      load: [1.21, 0.97, 0.9],
      upSince: now - 41 * DAY - 6 * HOUR,
      lastSeen: now - 12_000,
      health: "up",
      beats: strip(90, []),
      containers: 11,
    },
    {
      id: "misc",
      role: "everything that isn't media",
      spec: "ubuntu 24 · 4 ocpu · 24 gb · oracle, us east",
      cpu: 9,
      cpuSpark: series(21, 48, 8, 8),
      memUsed: 6412,
      memTotal: 23_931,
      memSpark: series(22, 48, 27, 4),
      swapUsed: 0,
      swapTotal: 0,
      diskUsed: 61.4,
      diskTotal: 196.2,
      diskTrend: climb(23, 30, 58.8, 61.4),
      load: [0.14, 0.11, 0.09],
      upSince: now - 132 * DAY - 2 * HOUR,
      lastSeen: now - 9000,
      health: "up",
      beats: strip(90, []),
      containers: 8,
    },
    {
      id: "home",
      role: "the dev box. off when the power is",
      spec: "arch · 16 cores · 64 gb · a desk",
      cpu: 0,
      cpuSpark: series(41, 48, 0, 0),
      memUsed: 0,
      memTotal: 64_000,
      memSpark: series(42, 48, 0, 0),
      swapUsed: 0,
      swapTotal: 0,
      diskUsed: 812,
      diskTotal: 1863,
      diskTrend: climb(43, 30, 790, 812),
      load: [0, 0, 0],
      upSince: 0,
      lastSeen: now - 6 * HOUR - 40 * MINUTE,
      health: "off",
      beats: strip(90, []).map(() => "off" as Health),
      containers: 0,
    },
    {
      id: "work",
      role: "not mine to show",
      spec: "debian 13 · 2 vcpu · 8 gb · somewhere",
      cpu: 17,
      cpuSpark: series(31, 48, 15, 10),
      memUsed: 3230,
      memTotal: 7890,
      memSpark: series(32, 48, 40, 3),
      swapUsed: 0,
      swapTotal: 2048,
      diskUsed: 27.9,
      diskTotal: 78.2,
      diskTrend: climb(33, 30, 26.1, 27.9),
      load: [0.42, 0.51, 0.48],
      upSince: now - 77 * DAY - 22 * HOUR,
      lastSeen: now - 14_000,
      health: "up",
      beats: strip(90, []),
      containers: 5,
    },
  ],
  services: [
    svc("jellyfin", "films and shows, the whole library", "media", 84),
    svc("jellyseerr", "requests, so nobody has to text me", "media", 121),
    svc("the arrs", "sonarr, radarr, prowlarr. the plumbing", "media", 43),
    svc("navidrome", "the flac collection, streamed", "media", 38),
    svc("immich", "every photo since 2014, backed up nightly", "media", 131),
    svc("vaultwarden", "passwords, held by nobody but me", "misc", 31),
    svc("forgejo", "git, for what shouldn't be on github", "misc", 56),
    svc("miniflux", "rss. the internet at reading speed", "misc", 38),
    svc("headscale", "the mesh stitching all of this together", "misc", 12),
    svc("conduit", "matrix, for the chat that left discord", "misc", 74),
    svc("restic", "everything above, copied offsite nightly", "misc", 9),
    svc("this page", "the workshop watching itself", "misc", 6),
    {
      ...svc("ollama", "local models, when the desk is on", "home", 0),
      health: "off",
      strip: strip(90, []).map(() => "off" as Health),
      uptime30: 0,
    },
  ],
  incidents: [],
});

const svc = (
  name: string,
  blurb: string,
  host: string,
  latency: number
): Service => ({
  id: name.replace(/\s+/g, "-"),
  name,
  blurb,
  who: "",
  host,
  health: "up",
  latency,
  strip: strip(90, []),
  uptime30: 100,
});

// The one-line version of the page: what's awake, what isn't, who's loudest.
export const summarize = (fleet: Fleet) => {
  const awake = fleet.hosts.filter(
    (h) => h.health === "up" || h.health === "slow"
  ).length;
  const off = fleet.hosts.filter((h) => h.health === "off");
  const listed = fleet.services.filter((s) => s.health !== "off");
  const answering = listed.filter((s) => s.health === "up").length;
  const quiet = fleet.services.filter((s) => s.health === "down");
  const [loud] = [...fleet.hosts].sort((a, b) => b.cpu - a.cpu);
  return {
    awake,
    hosts: fleet.hosts.length,
    answering,
    services: listed.length,
    off,
    quiet,
    loud,
  };
};

export const HEALTH_LABEL: Record<Health, string> = {
  up: "answering",
  slow: "slow to answer",
  down: "quiet",
  off: "off",
};
