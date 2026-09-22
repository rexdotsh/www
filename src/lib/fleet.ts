// The workshop (/status): what it shows, and the whitelist of what it may show.
// `off` is a box that's meant to be off; `down` one that isn't; `none` no data yet.
export type Health = "up" | "down" | "off" | "none";

// Anything the agent reports that isn't listed here is dropped at ingest.
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

// Exact docker names; several means all must be running.
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
  role: string;
  spec: string;
  upSince: number;
}

export interface Service {
  blurb: string;
  health: Health;
  host: string;
  id: string;
  mem: number;
  strip: Health[];
  uptime30: number;
}

// What the agent posts: MB for memory and disk, epoch seconds for boot.
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

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const fmtGb = (gb: number) =>
  gb >= 1024
    ? `${(gb / 1024).toFixed(1)}t`
    : gb >= 100
      ? `${Math.round(gb)}g`
      : `${gb.toFixed(1)}g`;

export const fmtMb = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)}g` : `${Math.round(mb)}m`;

export const fmtUptime = (since: number, now = Date.now()) => {
  const m = Math.max(0, Math.floor((now - since) / 60_000));
  const [d, h] = [Math.floor(m / 1440), Math.floor((m % 1440) / 60)];
  return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m}m`;
};

export const pct = (used: number, total: number) =>
  total ? Math.round((used / total) * 100) : 0;

export const summarize = (fleet: Fleet) => {
  const listed = fleet.services.filter((s) => s.health !== "off");
  return {
    hosts: fleet.hosts.length,
    off: fleet.hosts.filter((h) => h.health === "off"),
    services: listed.length,
    answering: listed.filter((s) => s.health === "up").length,
  };
};

// Seeded so SSR and the client draw the same line.
const wobble = (seed: number, base: number, spread: number) => {
  let s = seed;
  let v = base;
  return Array.from({ length: 48 }, () => {
    s = (s * 48_271) % 2_147_483_647;
    v = Math.min(
      100,
      Math.max(0, v * 0.92 + base * 0.08 + (s / 2_147_483_647 - 0.5) * spread)
    );
    return Math.round(v);
  });
};

const fill = <T>(n: number, v: T) => new Array(n).fill(v);

const mockHost = (id: string, h: Partial<Host>, now: number): Host => ({
  id,
  ...HOSTS[id],
  health: "up",
  cpu: 0,
  cpuSpark: fill(48, 0),
  memUsed: 0,
  memTotal: 0,
  diskUsed: 0,
  diskTotal: 0,
  load: [0, 0, 0],
  upSince: 0,
  lastSeen: now - 10_000,
  beats: fill(90, "up"),
  containers: 0,
  ...h,
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

export const mockFleet = (now = Date.now()): Fleet => ({
  mock: true,
  measuredAt: now - 12_000,
  hosts: [
    mockHost(
      "media",
      {
        spec: `ubuntu 24 · 4 vcpu · 16 gb · ${HOSTS.media.spec}`,
        cpu: 41,
        cpuSpark: wobble(11, 38, 22),
        memUsed: 9870,
        memTotal: 15_990,
        diskUsed: 1318,
        diskTotal: 1863,
        load: [1.21, 0.97, 0.9],
        upSince: now - 41 * DAY - 6 * HOUR,
        containers: 11,
      },
      now
    ),
    mockHost(
      "misc",
      {
        spec: `ubuntu 24 · 4 ocpu · 24 gb · ${HOSTS.misc.spec}`,
        cpu: 9,
        cpuSpark: wobble(21, 8, 8),
        memUsed: 6412,
        memTotal: 23_931,
        diskUsed: 61.4,
        diskTotal: 196.2,
        load: [0.14, 0.11, 0.09],
        upSince: now - 132 * DAY - 2 * HOUR,
        containers: 8,
      },
      now
    ),
    mockHost(
      "home",
      {
        spec: `ubuntu 24 · 16 cores · 64 gb · ${HOSTS.home.spec}`,
        health: "off",
        memTotal: 64_000,
        diskUsed: 812,
        diskTotal: 1863,
        lastSeen: now - 6 * HOUR - 40 * 60_000,
        beats: fill(90, "off"),
      },
      now
    ),
    mockHost(
      "work",
      {
        spec: `ubuntu 24 · 2 vcpu · 8 gb · ${HOSTS.work.spec}`,
        cpu: 17,
        cpuSpark: wobble(31, 15, 10),
        memUsed: 3230,
        memTotal: 7890,
        diskUsed: 27.9,
        diskTotal: 78.2,
        load: [0.42, 0.51, 0.48],
        upSince: now - 77 * DAY - 22 * HOUR,
        containers: 5,
      },
      now
    ),
  ],
  services: SERVICES.map((s) => {
    const off = s.host === "home";
    return {
      id: s.id,
      blurb: s.blurb,
      host: s.host,
      health: off ? "off" : "up",
      mem: off ? 0 : (MOCK_MEM[s.id] ?? 64),
      strip: fill(90, off ? "off" : "up"),
      uptime30: off ? 0 : 100,
    };
  }),
});
