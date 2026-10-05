import { useEffect, useState } from "react";
import type { NowPlaying } from "@/lib/spotify";

const POLL_INTERVAL = 60_000;

export function useNowPlaying() {
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let previewId: string | undefined;
    let polling = false;
    let lastPollAt = 0;
    const abortController = new AbortController();

    const schedule = (delay: number) => {
      clearTimeout(timeout);
      if (!abortController.signal.aborted && !document.hidden) {
        timeout = setTimeout(poll, delay);
      }
    };

    const poll = async () => {
      if (polling || document.hidden) {
        return;
      }
      polling = true;
      lastPollAt = Date.now();
      try {
        const response = await fetch("/api/spotify/playing", {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = (await response.json()) as NowPlaying | null;
          setTrack((current) =>
            current?.id === data?.id && current?.isPlaying === data?.isPlaying
              ? current
              : data
          );
          if (data && data.id !== previewId) {
            setPreviewUrl(null);
            const preview = await fetch(`/api/spotify/preview/${data.id}`, {
              signal: abortController.signal,
            });
            // 4xx means no preview exists; 5xx and throws stay unresolved to retry.
            if (preview.ok) {
              const { url } = (await preview.json()) as { url?: string };
              previewId = data.id;
              setPreviewUrl(url ?? null);
            } else if (preview.status < 500) {
              previewId = data.id;
            }
          }
        }
      } catch {
        // Retry on the next poll.
      } finally {
        polling = false;
      }
      schedule(POLL_INTERVAL);
    };

    const onVisibility = () => {
      clearTimeout(timeout);
      if (!document.hidden) {
        schedule(Math.max(0, POLL_INTERVAL - (Date.now() - lastPollAt)));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    poll();
    return () => {
      abortController.abort();
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { track, previewUrl };
}
