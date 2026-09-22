// Shapes for the workshop (/status). Mock data for now; the Fleet DO will
// return the same `Fleet` once the agents are reporting.

export type Health = "up" | "slow" | "down";

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
      id: "caladan",
      role: "media, the loud one",
      spec: "debian 13 · 8 vcpu · 32 gb · one tired gpu",
      cpu: 41,
      cpuSpark: series(11, 48, 38, 22),
      memUsed: 19_870,
      memTotal: 32_048,
      memSpark: series(12, 48, 61, 6),
      swapUsed: 412,
      swapTotal: 8192,
      diskUsed: 3318,
      diskTotal: 3726,
      diskTrend: climb(13, 30, 2940, 3318),
      load: [3.21, 2.87, 2.6],
      upSince: now - 41 * DAY - 6 * HOUR,
      lastSeen: now - 12_000,
      health: "up",
      beats: strip(90, []),
      containers: 14,
    },
    {
      id: "arrakis",
      role: "the one that faces the internet",
      spec: "debian 13 · 2 vcpu · 4 gb · somewhere in frankfurt",
      cpu: 9,
      cpuSpark: series(21, 48, 8, 8),
      memUsed: 1412,
      memTotal: 3931,
      memSpark: series(22, 48, 36, 4),
      swapUsed: 0,
      swapTotal: 1024,
      diskUsed: 21.4,
      diskTotal: 78.2,
      diskTrend: climb(23, 30, 19.8, 21.4),
      load: [0.14, 0.11, 0.09],
      upSince: now - 132 * DAY - 2 * HOUR,
      lastSeen: now - 9000,
      health: "up",
      beats: strip(90, []),
      containers: 6,
    },
    {
      id: "giedi",
      role: "storage, quietly",
      spec: "nixos · 4 cores · 16 gb · 6 spinning disks",
      cpu: 6,
      cpuSpark: series(31, 48, 5, 6),
      memUsed: 11_230,
      memTotal: 15_890,
      memSpark: series(32, 48, 70, 3),
      swapUsed: 0,
      swapTotal: 0,
      diskUsed: 27_910,
      diskTotal: 43_650,
      diskTrend: climb(33, 30, 26_100, 27_910),
      load: [0.42, 0.51, 0.48],
      upSince: now - 17 * DAY - 22 * HOUR,
      lastSeen: now - 14_000,
      health: "up",
      beats: strip(90, [31]),
      containers: 3,
    },
    {
      id: "kaitain",
      role: "the desk, when it's on",
      spec: "arch · 16 cores · 64 gb · sometimes asleep",
      cpu: 23,
      cpuSpark: series(41, 48, 20, 30),
      memUsed: 22_100,
      memTotal: 64_000,
      memSpark: series(42, 48, 34, 10),
      swapUsed: 0,
      swapTotal: 0,
      diskUsed: 812,
      diskTotal: 1863,
      diskTrend: climb(43, 30, 790, 812),
      load: [1.8, 2.2, 1.9],
      upSince: now - 3 * HOUR - 12 * MINUTE,
      lastSeen: now - 4 * MINUTE - 20_000,
      health: "slow",
      beats: [...strip(85, [40]), "down", "down", "down", "down", "slow"],
      containers: 0,
    },
  ],
  services: [
    {
      id: "jellyfin",
      name: "jellyfin",
      blurb: "films and shows, the whole library",
      who: "six friends and a parent",
      host: "caladan",
      health: "up",
      latency: 84,
      strip: strip(90, [23]),
      uptime30: 99.91,
    },
    {
      id: "immich",
      name: "immich",
      blurb: "every photo since 2014, backed up nightly",
      who: "me, my partner",
      host: "caladan",
      health: "up",
      latency: 121,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "navidrome",
      name: "navidrome",
      blurb: "the flac collection, streamed",
      who: "me, and whoever asks",
      host: "caladan",
      health: "up",
      latency: 43,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "vaultwarden",
      name: "vaultwarden",
      blurb: "passwords, held by nobody but me",
      who: "family",
      host: "arrakis",
      health: "up",
      latency: 31,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "forgejo",
      name: "forgejo",
      blurb: "git, for what shouldn't be on github",
      who: "me, a few collaborators",
      host: "arrakis",
      health: "up",
      latency: 56,
      strip: strip(90, [71]),
      uptime30: 99.87,
    },
    {
      id: "miniflux",
      name: "miniflux",
      blurb: "rss. the internet at reading speed",
      who: "me",
      host: "arrakis",
      health: "up",
      latency: 38,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "headscale",
      name: "headscale",
      blurb: "the mesh stitching all of this together",
      who: "every machine here",
      host: "arrakis",
      health: "up",
      latency: 12,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "matrix",
      name: "conduit",
      blurb: "matrix, for the chat that left discord",
      who: "eleven people",
      host: "arrakis",
      health: "slow",
      latency: 612,
      strip: strip(90, [86, 88]),
      uptime30: 99.4,
    },
    {
      id: "nextcloud",
      name: "nextcloud",
      blurb: "files, calendars, the boring essentials",
      who: "family, two friends",
      host: "giedi",
      health: "up",
      latency: 203,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "restic",
      name: "restic",
      blurb: "everything above, copied offsite nightly",
      who: "future me",
      host: "giedi",
      health: "up",
      latency: 9,
      strip: strip(90, []),
      uptime30: 100,
    },
    {
      id: "paperless",
      name: "paperless",
      blurb: "every letter, scanned, searchable",
      who: "me",
      host: "giedi",
      health: "up",
      latency: 97,
      strip: strip(90, [12]),
      uptime30: 99.93,
    },
    {
      id: "minecraft",
      name: "minecraft",
      blurb: "a world that's been running since 2021",
      who: "the group chat, weekends",
      host: "kaitain",
      health: "down",
      latency: 0,
      strip: strip(90, [40, 41, 42, 89]),
      uptime30: 96.2,
    },
    {
      id: "ollama",
      name: "ollama",
      blurb: "local models, for when the desk is awake",
      who: "me",
      host: "kaitain",
      health: "down",
      latency: 0,
      strip: strip(90, [3, 40, 41, 42, 89]),
      uptime30: 95.8,
    },
    {
      id: "uptime",
      name: "this page",
      blurb: "the workshop watching itself",
      who: "you",
      host: "arrakis",
      health: "up",
      latency: 6,
      strip: strip(90, []),
      uptime30: 100,
    },
  ],
  incidents: [
    {
      ts: now - 4 * MINUTE,
      service: "kaitain",
      duration: 4 * 60,
      note: "went quiet. probably asleep; it does that.",
      resolved: false,
    },
    {
      ts: now - 2 * DAY - 7 * HOUR,
      service: "conduit",
      duration: 11 * 60,
      note: "slow to answer for a while. federation catching up.",
      resolved: true,
    },
    {
      ts: now - 6 * DAY - 3 * HOUR,
      service: "jellyfin",
      duration: 6 * 60,
      note: "restarted itself mid-episode. nobody complained.",
      resolved: true,
    },
    {
      ts: now - 19 * DAY,
      service: "forgejo",
      duration: 14 * 60,
      note: "down for an upgrade. on purpose, for once.",
      resolved: true,
    },
  ],
});

// The one-line version of the page: what's awake, what isn't, who's loudest.
export const summarize = (fleet: Fleet) => {
  const awake = fleet.hosts.filter((h) => h.health !== "down").length;
  const answering = fleet.services.filter((s) => s.health === "up").length;
  const quiet = fleet.services.filter((s) => s.health === "down");
  const [loud] = [...fleet.hosts].sort((a, b) => b.cpu - a.cpu);
  return {
    awake,
    hosts: fleet.hosts.length,
    answering,
    services: fleet.services.length,
    quiet,
    loud,
  };
};

export const HEALTH_LABEL: Record<Health, string> = {
  up: "answering",
  slow: "slow to answer",
  down: "quiet",
};
