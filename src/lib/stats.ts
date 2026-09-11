import { useEffect, useState } from "react";

export interface RecentVisitor {
  ago: string;
  path: string;
  place: string;
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
  mock?: boolean;
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

type BeaconInput = Beacon extends infer B
  ? B extends { visitor: string }
    ? Omit<B, "visitor">
    : never
  : never;

export const GUESTBOOK_LIMITS = {
  name: 24,
  message: 80,
  cooldownMs: 10 * 60_000,
  shown: 3,
} as const;

export const VISITOR_RE = /^[a-z0-9]{6,32}$/;

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

const VISITOR_KEY = "visitor";
let visitorId: string | null = null;

export const visitor = () => {
  if (visitorId) {
    return visitorId;
  }
  try {
    visitorId = localStorage.getItem(VISITOR_KEY);
  } catch {
    visitorId = null;
  }
  if (!visitorId) {
    visitorId = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    try {
      localStorage.setItem(VISITOR_KEY, visitorId);
    } catch {
      // private mode; id lives for this load only
    }
  }
  return visitorId;
};

export const beacon = (payload: BeaconInput) => {
  const body = JSON.stringify({ ...payload, visitor: visitor() });
  if ("sendBeacon" in navigator) {
    navigator.sendBeacon("/api/beacon", body);
    return;
  }
  fetch("/api/beacon", { method: "POST", body, keepalive: true }).catch(
    () => undefined
  );
};

export function useBeacon(path: string) {
  useEffect(() => {
    const start = Date.now();
    let depth = 0;
    let sent = false;

    const measure = () => {
      const { scrollHeight } = document.documentElement;
      const seen =
        scrollHeight <= innerHeight
          ? 100
          : Math.round(((scrollY + innerHeight) / scrollHeight) * 100);
      depth = Math.max(depth, Math.min(100, seen));
    };

    const leave = () => {
      if (sent) {
        return;
      }
      sent = true;
      measure();
      beacon({
        type: "leave",
        path,
        depth,
        seconds: Math.round((Date.now() - start) / 1000),
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        leave();
      }
    };

    beacon({ type: "view", path });
    measure();
    addEventListener("scroll", measure, { passive: true });
    addEventListener("pagehide", leave);
    addEventListener("visibilitychange", onVisibility);
    return () => {
      leave();
      removeEventListener("scroll", measure);
      removeEventListener("pagehide", leave);
      removeEventListener("visibilitychange", onVisibility);
    };
  }, [path]);
}

const REFRESH_MS = 60_000;

let cache: SiteStats | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<(stats: SiteStats) => void>();

const publish = (stats: SiteStats) => {
  cache = stats;
  for (const listener of listeners) {
    listener(stats);
  }
};

const load = () =>
  fetch("/api/stats")
    .then((response) =>
      response.ok ? (response.json() as Promise<SiteStats>) : null
    )
    .then((stats) => stats && publish(stats))
    .catch(() => undefined);

const start = () => {
  if (timer) {
    return;
  }
  load();
  timer = setInterval(() => {
    if (document.visibilityState === "visible") {
      load();
    }
  }, REFRESH_MS);
};

export const patchStats = (patch: (stats: SiteStats) => SiteStats) => {
  if (cache) {
    publish(patch(cache));
  }
};

export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(cache);

  useEffect(() => {
    listeners.add(setStats);
    if (cache) {
      setStats(cache);
    }
    const hasIdle = "requestIdleCallback" in window;
    const idle = hasIdle ? requestIdleCallback(start) : 0;
    const delay = hasIdle ? undefined : setTimeout(start, 1200);

    return () => {
      listeners.delete(setStats);
      if (hasIdle) {
        cancelIdleCallback(idle);
      }
      clearTimeout(delay);
      if (listeners.size === 0) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  }, []);

  return stats;
}
