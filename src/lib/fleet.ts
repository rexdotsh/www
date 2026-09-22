// Shapes for the workshop (/status), plus the whitelist of what it shows.
// Mock data for now; the Fleet DO will return the same `Fleet` once the
// agents (rexdotsh/fleet-agent, checked out at agent/) are reporting.

// `off` is a machine that's meant to be off (the desk); `down` is one that
// isn't. `none` is a cell with no data yet.
export type Health = "up" | "down" | "off" | "none";

// What the page shows for each host. Anything the agent reports that isn't
// listed here is dropped at ingest and never stored.
export const HOSTS: Record<
  string,
  { role: string; spec: string; intermittent?: boolean; private?: boolean }
> = {
  media: { role: "films, shows, music. the busy one", spec: "singapore" },
  misc: { role: "everything that isn't media", spec: "oracle, us east" },
  home: {
    role: "the dev box. off when the power is",
    spec: "a desk",
    intermittent: true,
  },
  work: { role: "not mine to show", spec: "somewhere", private: true },
};

// Exact docker names on the box; several names means all must be running.
export const SERVICES: {
  id: string;
  blurb: string;
  host: string;
  container: string | string[];
}[] = [
  {
    id: "jellyfin",
    blurb: "films and shows, the whole library",
    host: "media",
    container: "jellyfin",
  },
  {
    id: "jellyseerr",
    blurb: "requests, so nobody has to text me",
    host: "media",
    container: "jellyseerr",
  },
  {
    id: "the arrs",
    blurb: "sonarr, radarr, prowlarr. the plumbing",
    host: "media",
    container: ["sonarr", "radarr", "prowlarr"],
  },
  {
    id: "navidrome",
    blurb: "the flac collection, streamed",
    host: "media",
    container: "navidrome",
  },
  {
    id: "immich",
    blurb: "every photo since 2014, backed up nightly",
    host: "media",
    container: "immich_server",
  },
  {
    id: "vaultwarden",
    blurb: "passwords, held by nobody but me",
    host: "misc",
    container: "vaultwarden",
  },
  {
    id: "forgejo",
    blurb: "git, for what shouldn't be on github",
    host: "misc",
    container: "forgejo",
  },
  {
    id: "miniflux",
    blurb: "rss. the internet at reading speed",
    host: "misc",
    container: "miniflux",
  },
  {
    id: "headscale",
    blurb: "the mesh stitching all of this together",
    host: "misc",
    container: "headscale",
  },
  {
    id: "conduit",
    blurb: "matrix, for the chat that left discord",
    host: "misc",
    container: "conduit",
  },
  {
    id: "restic",
    blurb: "everything above, copied offsite nightly",
    host: "misc",
    container: "restic",
  },
  {
    id: "ollama",
    blurb: "local models, when the desk is on",
    host: "home",
    container: "ollama",
  },
];

export interface Host {
  /** last 90 heartbeats, one a minute */
  beats: Health[];
  containers: number;
  cpu: number;
  cpuSpark: number[];
  diskTotal: number;
  diskUsed: number;
  health: Health;
  id: string;
  lastSeen: number;
  load: [number, number, number];
  memTotal: number;
  memUsed: number;
  /** what it's for, one line */
  role: string;
  /** os · cpus · ram · where, from the agent plus HOSTS */
  spec: string;
  upSince: number;
}

export interface Service {
  blurb: string;
  health: Health;
  host: string;
  id: string;
  /** container memory, MB */
  mem: number;
  /** last 90 minutes of container state, oldest first */
  strip: Health[];
  uptime30: number;
}

// What the agent posts. Memory and disk in MB, `boot` in epoch seconds.
export interface Sample {
  boot: number;
  containers: { n: string; s: string; m?: number }[];
  cpu: number;
  cpus: number;
  disk: [number, number];
  load: [number, number, number];
  mem: [number, number];
  os: string;
}

export interface Fleet {
  hosts: Host[];
  measuredAt: number;
  mock?: boolean;
  services: Service[];
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

const strip = (n: number, blips: number[]): Health[] => {
  const out: Health[] = Array.from({ length: n }, () => "up");
  for (const i of blips) {
    out[i] = "down";
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
  hosts: [
    {
      id: "media",
      ...HOSTS.media,
      spec: `ubuntu 24 · 4 vcpu · 16 gb · ${HOSTS.media.spec}`,
      cpu: 41,
      cpuSpark: series(11, 48, 38, 22),
      memUsed: 9870,
      memTotal: 15_990,
      diskUsed: 1318,
      diskTotal: 1863,
      load: [1.21, 0.97, 0.9],
      upSince: now - 41 * DAY - 6 * HOUR,
      lastSeen: now - 12_000,
      health: "up",
      beats: strip(90, []),
      containers: 11,
    },
    {
      id: "misc",
      ...HOSTS.misc,
      spec: `ubuntu 24 · 4 ocpu · 24 gb · ${HOSTS.misc.spec}`,
      cpu: 9,
      cpuSpark: series(21, 48, 8, 8),
      memUsed: 6412,
      memTotal: 23_931,
      diskUsed: 61.4,
      diskTotal: 196.2,
      load: [0.14, 0.11, 0.09],
      upSince: now - 132 * DAY - 2 * HOUR,
      lastSeen: now - 9000,
      health: "up",
      beats: strip(90, []),
      containers: 8,
    },
    {
      id: "home",
      ...HOSTS.home,
      spec: `ubuntu 24 · 16 cores · 64 gb · ${HOSTS.home.spec}`,
      cpu: 0,
      cpuSpark: series(41, 48, 0, 0),
      memUsed: 0,
      memTotal: 64_000,
      diskUsed: 812,
      diskTotal: 1863,
      load: [0, 0, 0],
      upSince: 0,
      lastSeen: now - 6 * HOUR - 40 * MINUTE,
      health: "off",
      beats: strip(90, []).map(() => "off" as Health),
      containers: 0,
    },
    {
      id: "work",
      ...HOSTS.work,
      spec: `ubuntu 24 · 2 vcpu · 8 gb · ${HOSTS.work.spec}`,
      cpu: 17,
      cpuSpark: series(31, 48, 15, 10),
      memUsed: 3230,
      memTotal: 7890,
      diskUsed: 27.9,
      diskTotal: 78.2,
      load: [0.42, 0.51, 0.48],
      upSince: now - 77 * DAY - 22 * HOUR,
      lastSeen: now - 14_000,
      health: "up",
      beats: strip(90, []),
      containers: 5,
    },
  ],
  services: SERVICES.map((svc) => {
    const off = svc.host === "home";
    return {
      id: svc.id,
      blurb: svc.blurb,
      host: svc.host,
      health: off ? "off" : "up",
      mem: off ? 0 : (MOCK_MEM[svc.id] ?? 64),
      strip: strip(90, []).map((h) => (off ? "off" : h)),
      uptime30: off ? 0 : 100,
    };
  }),
});

const MOCK_MEM: Record<string, number> = {
  jellyfin: 1240,
  jellyseerr: 210,
  "the arrs": 890,
  navidrome: 96,
  immich: 1810,
  vaultwarden: 58,
  forgejo: 310,
  miniflux: 41,
  headscale: 27,
  conduit: 180,
  restic: 12,
};

// The one-line version of the page: what's awake, what isn't, who's loudest.
export const summarize = (fleet: Fleet) => {
  const awake = fleet.hosts.filter((h) => h.health === "up").length;
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
  down: "quiet",
  off: "off",
  none: "no data",
};
