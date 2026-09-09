// Mock visitor data for the homepage stats exploration. Static strings so
// server and client render identically. Real source would be a tiny worker
// counter (KV/DO) fed by request.cf.city + the umami active-visitors endpoint.

export interface RecentVisitor {
  ago: string;
  page: string;
  place: string;
}

export const ONLINE = 3;

export const RECENT: RecentVisitor[] = [
  { place: "tokyo", ago: "just now", page: "/" },
  { place: "berlin", ago: "4m", page: "/blog/parabox" },
  { place: "austin", ago: "11m", page: "/" },
  { place: "bengaluru", ago: "26m", page: "/" },
  { place: "somewhere", ago: "1h", page: "/blog" },
];

export const COUNTS = {
  today: 41,
  week: 1204,
  visitorNumber: 48_213,
};

// pageviews per post slug
export const POST_READS: Record<string, number> = {
  parabox: 2214,
};

// people who copied the email / opened the mail link this month
export const HI_COUNT = 12;

// idle lines the rose caption can swap to when nobody is hovering
export const ROSE_NOTES = [
  `( ${ONLINE} others are looking at this )`,
  `( someone in ${RECENT[0].place} just arrived )`,
  `( ${COUNTS.today} of you today. hi. )`,
];

export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
