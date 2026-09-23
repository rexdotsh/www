// `off` is a box that's meant to be off; `down` one that isn't; `none` no data yet.
export type Health = "up" | "down" | "off" | "none";

// Anything the agent reports that isn't listed here is dropped at ingest.
export const HOSTS: Record<
  string,
  { role: string; spec: string; intermittent?: boolean; private?: boolean }
> = {
  media: { role: "the media server", spec: "singapore" },
  misc: { role: "everything else", spec: "oracle, us east" },
  home: {
    role: "the homelab",
    spec: "bengaluru",
    intermittent: true,
  },
  work: { role: "the day job", spec: "somewhere", private: true },
};

// Exact docker names; several means all must be running.
export const SERVICES: {
  id: string;
  blurb: string;
  host: string;
  container: string | string[];
}[] = [
  {
    id: "plex",
    blurb: "films and shows, the whole library",
    host: "media",
    container: "plex",
  },
  {
    id: "seerr",
    blurb: "where requests go",
    host: "media",
    container: "jellyseerr",
  },
  {
    id: "the arrs",
    blurb: "sonarr and radarr. the plumbing",
    host: "media",
    container: ["sonarr", "radarr"],
  },
  {
    id: "infinidysk",
    blurb: "usenet, streamed straight into plex",
    host: "media",
    container: ["infinidysk", "rclone-infinidysk"],
  },
  {
    id: "autoscan",
    blurb: "tells plex when something new landed",
    host: "media",
    container: "autoscan",
  },
  {
    id: "byparr",
    blurb: "gets past the cloudflare pages the arrs can't",
    host: "media",
    container: "byparr",
  },
  {
    id: "the bot",
    blurb: "a discord bot for the media server",
    host: "media",
    container: "mediaserver-bot",
  },
  {
    id: "orchid",
    blurb: "a meme and pfp editor, not at 4 fps",
    host: "media",
    container: ["orchid-frontend", "orchid-backend"],
  },
  {
    id: "faux",
    blurb: "placeholders as a microservice",
    host: "misc",
    container: "faux",
  },
  {
    id: "sakura",
    blurb: "avatars as a microservice",
    host: "misc",
    container: "sakura",
  },
  {
    id: "kleis",
    blurb: "an oauth proxy for coding agents",
    host: "misc",
    container: "kleis-app",
  },
  {
    id: "hedgedoc",
    blurb: "shared markdown, for notes with people",
    host: "misc",
    container: "hedgedoc-app-1",
  },
  {
    id: "copyparty",
    blurb: "a folder, on the internet",
    host: "media",
    container: "copyparty",
  },
  {
    id: "zipline",
    blurb: "screenshots and files, by link",
    host: "misc",
    container: "zipline-zipline-1",
  },
  {
    id: "wastebin",
    blurb: "pastebin, without the pastebin",
    host: "misc",
    container: "wastebin-wastebin-1",
  },
  { id: "minio", blurb: "s3 at home", host: "misc", container: "minio" },
  {
    id: "hass",
    blurb: "home assistant",
    host: "home",
    container: "homeassistant",
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
    : gb >= 10
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

export const hmac = async (key: string, message: string) => {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return Array.from(new Uint8Array(mac), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
};

export const hostKey = (secret: string, host: string) =>
  hmac(secret, `fleet:${host}`);

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

const mockHost = (
  id: string,
  now: number,
  h: Omit<Host, "id" | "role" | "health" | "lastSeen" | "beats">
): Host => ({
  id,
  ...HOSTS[id],
  health: "up",
  lastSeen: now - 10_000,
  beats: fill(90, "up"),
  ...h,
});

const MOCK_MEM: Record<string, number> = {
  plex: 244,
  seerr: 194,
  "the arrs": 329,
  infinidysk: 864,
  autoscan: 17,
  byparr: 287,
  copyparty: 10,
  orchid: 104,
  "the bot": 27,
  kleis: 215,
  hedgedoc: 180,
  wastebin: 61,
  zipline: 161,
  minio: 346,
  faux: 12,
  sakura: 20,
  hass: 62,
};

export const mockFleet = (now = Date.now()): Fleet => ({
  mock: true,
  measuredAt: now - 12_000,
  hosts: [
    mockHost("media", now, {
      spec: `ubuntu 24.04 · 4 vcpu · 6 gb · ${HOSTS.media.spec}`,
      cpu: 11,
      cpuSpark: wobble(11, 11, 10),
      memUsed: 2425,
      memTotal: 5925,
      diskUsed: 78,
      diskTotal: 99,
      load: [0.79, 0.93, 1.0],
      upSince: now - 36 * DAY - 18 * HOUR,
      containers: 17,
    }),
    mockHost("misc", now, {
      spec: `ubuntu 22.04 · 2 vcpu · 12 gb · ${HOSTS.misc.spec}`,
      cpu: 5,
      cpuSpark: wobble(21, 5, 5),
      memUsed: 7347,
      memTotal: 11_932,
      diskUsed: 42,
      diskTotal: 192,
      load: [0.18, 0.17, 0.16],
      upSince: now - 48 * DAY - 45 * 60_000,
      containers: 12,
    }),
    mockHost("home", now, {
      spec: `ubuntu 24.04 · 6 cores · 8 gb · ${HOSTS.home.spec}`,
      cpu: 38,
      cpuSpark: wobble(41, 35, 30),
      memUsed: 2305,
      memTotal: 7888,
      diskUsed: 99,
      diskTotal: 107,
      load: [3.71, 7.67, 6.02],
      upSince: now - 10 * DAY - HOUR,
      containers: 6,
    }),
    mockHost("work", now, {
      spec: `ubuntu 24.04 · 4 vcpu · 8 gb · ${HOSTS.work.spec}`,
      cpu: 3,
      cpuSpark: wobble(31, 3, 4),
      memUsed: 3470,
      memTotal: 7751,
      diskUsed: 28,
      diskTotal: 150,
      load: [0.49, 0.47, 0.4],
      upSince: now - 314 * DAY - 21 * HOUR,
      containers: 23,
    }),
  ],
  services: SERVICES.map((s) => ({
    id: s.id,
    blurb: s.blurb,
    host: s.host,
    health: "up",
    mem: MOCK_MEM[s.id] ?? 64,
    strip: fill(90, "up"),
    uptime30: 100,
  })),
});
