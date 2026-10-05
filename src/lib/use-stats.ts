import { useEffect, useState } from "react";
import type { Beacon, SiteStats } from "@/lib/stats";
import { getJson, whenIdle } from "@/lib/utils";

type BeaconInput = Beacon extends infer B
  ? B extends { visitor: string }
    ? Omit<B, "visitor">
    : never
  : never;

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
  getJson<SiteStats>("/api/stats").then((stats) => stats && publish(stats));

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
    const cancel = whenIdle(start);

    return () => {
      listeners.delete(setStats);
      cancel();
      if (listeners.size === 0) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  }, []);

  return stats;
}
