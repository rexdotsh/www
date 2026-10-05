// Shared with the www-room worker: changes here need `bun run deploy:room`.

interface RecentVisitor {
  ago: string;
  path: string;
  place: string;
  tag: string;
}

export interface GuestbookEntry {
  ago: string;
  id: number;
  message: string;
  name: string;
  place: string;
}

export interface SiteStats {
  guestbook: GuestbookEntry[];
  hi: number;
  online: number;
  paths: Record<string, number>;
  recent: RecentVisitor[];
  signed: number;
  today: number;
  total: number;
  week: number;
}

export type Beacon =
  | { type: "view"; path: string; visitor: string }
  | {
      type: "leave";
      path: string;
      visitor: string;
      depth: number;
      seconds: number;
    }
  | { type: "hi"; visitor: string };

export const GUESTBOOK_LIMITS = {
  name: 24,
  message: 80,
  cooldownMs: 10 * 60_000,
  shown: 3,
} as const;

export const VISITOR_RE = /^[a-z0-9]{6,32}$/;

// A short one-way handle (djb2) so a page can spot its own visit in `recent`.
export const visitorTag = (visitor: string) => {
  let hash = 5381;
  for (const char of visitor) {
    hash = (hash * 33 + char.charCodeAt(0)) % 4_294_967_296;
  }
  return hash.toString(36);
};

export const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

export const ago = (then: number, now = Date.now()) => {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
};
