// Mock analytics for the /stats design exploration. Everything here is
// deterministic (seeded) so server and client render the same numbers.
// Real data would come from the Umami API + a few first-party counters.

// park–miller lcg: tiny, deterministic, good enough for fake charts
const MOD = 2_147_483_647;
const MUL = 48_271;

const lcg = (seed: number) => {
  let state = seed % MOD;
  return () => {
    state = (state * MUL) % MOD;
    return state / MOD;
  };
};

const rand = lcg(0x70_5e);

export interface Ranked {
  label: string;
  sub?: string;
  value: number;
}

export interface LiveReader {
  page: string;
  place: string;
}

// ── right now ────────────────────────────────────────────────────────────

export const LIVE: LiveReader[] = [
  { place: "berlin", page: "/blog/parabox" },
  { place: "austin", page: "/" },
  { place: "somewhere in india", page: "/" },
  { place: "won't say", page: "/blog" },
];

// ── thirty days ──────────────────────────────────────────────────────────

const DAYS = 30;

// gentle weekday rhythm + a spike ten days ago (hn front page, allegedly)
export const DAILY_VISITORS: number[] = Array.from({ length: DAYS }, (_, i) => {
  const dow = i % 7;
  const weekday = dow === 5 || dow === 6 ? 0.62 : 1;
  const base = 118 + Math.sin(i / 4.2) * 22;
  const noise = (rand() - 0.5) * 34;
  const spike = i === DAYS - 10 ? 410 : i === DAYS - 9 ? 170 : 0;
  return Math.round(base * weekday + noise + spike);
});

export const TOTALS = {
  visitors: DAILY_VISITORS.reduce((a, b) => a + b, 0),
  views: Math.round(DAILY_VISITORS.reduce((a, b) => a + b, 0) * 1.94),
  avgSeconds: 161,
  bounce: 0.58,
  deltaVisitors: 0.23,
};

// ── a year of visits ─────────────────────────────────────────────────────

const WEEKS = 52;

export const YEAR_HEAT: number[][] = Array.from({ length: WEEKS }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const weekend = d === 0 || d === 6;
    const roll = rand();
    // the november spike; a quieter summer
    const seasonal = w > 40 && w < 44 ? 1.6 : w > 22 && w < 32 ? 0.6 : 1;
    const level = roll * seasonal * (weekend ? 0.6 : 1);
    if (w === 42 && d === 3) return 4;
    if (level > 0.92) return 4;
    if (level > 0.7) return 3;
    if (level > 0.45) return 2;
    if (level > 0.15) return 1;
    return 0;
  })
);

// ── where / from ─────────────────────────────────────────────────────────

export const COUNTRIES: Ranked[] = [
  { label: "united states", value: 0.31 },
  { label: "india", value: 0.22 },
  { label: "germany", value: 0.11 },
  { label: "united kingdom", value: 0.08 },
  { label: "japan", value: 0.05 },
  { label: "everywhere else", value: 0.23 },
];

export const REFERRERS: Ranked[] = [
  { label: "direct", value: 0.44, sub: "typed it, or a bookmark" },
  { label: "x.com", value: 0.21 },
  { label: "github.com", value: 0.14 },
  { label: "news.ycombinator.com", value: 0.09, sub: "one good day" },
  { label: "google", value: 0.07 },
  { label: "other", value: 0.05 },
];

// ── what gets read ───────────────────────────────────────────────────────

export const PAGES: Ranked[] = [
  { label: "/", value: 5802 },
  { label: "/blog/parabox", value: 2214 },
  { label: "/blog", value: 1037 },
  { label: "/resume", value: 287 },
];

// how far readers scroll through the one post, in deciles
export const READ_DEPTH: number[] = [100, 91, 82, 74, 66, 58, 52, 47, 44, 41];

export const POST_STATS = {
  slug: "parabox",
  reads: 2214,
  medianMinutes: 6.4,
  finished: 0.41,
};

// ── when ─────────────────────────────────────────────────────────────────

export const HOURS: number[] = Array.from({ length: 24 }, (_, h) => {
  // visitor local time. late-night heavy, dip at 5am, small lunch bump
  const night =
    Math.exp(-((h - 23) ** 2) / 14) + Math.exp(-((h + 1) ** 2) / 14);
  const lunch = 0.35 * Math.exp(-((h - 13) ** 2) / 4);
  const evening = 0.7 * Math.exp(-((h - 20) ** 2) / 8);
  const floor = 0.18;
  return Math.round((night + lunch + evening + floor + rand() * 0.08) * 100);
});

// ── how ──────────────────────────────────────────────────────────────────

// first-party: the toggles on this very site
export const CHOICES = {
  dark: 0.71,
  soundOn: 0.09,
  phone: 0.63,
  copiedEmail: 3,
  playedPreview: 0.27,
};

// ── listening ────────────────────────────────────────────────────────────

export const LISTENING = {
  hours: 61,
  topArtist: "jai paul",
  tracks: [
    { name: "str8 outta mumbai", artist: "jai paul", plays: 41 },
    { name: "seigfried", artist: "frank ocean", plays: 33 },
    { name: "genesis", artist: "grimes", plays: 29 },
    { name: "gooey", artist: "glass animals", plays: 24 },
  ],
};
