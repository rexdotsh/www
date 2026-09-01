import { useEffect, useState } from "react";

const POLL_INTERVAL = 60_000;

export interface SpotifyTrack {
  album: string;
  artist: string;
  id: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large";
  }>;
  isPlaying: boolean;
  name: string;
  url: string;
}

export function useNowPlaying() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const abortController = new AbortController();

    const poll = async () => {
      try {
        const response = await fetch("/api/spotify/playing", {
          signal: abortController.signal,
        });
        if (response.ok) {
          setTrack((await response.json()) as SpotifyTrack | null);
        }
      } catch {
        // ignore aborts and network hiccups; next poll retries
      }
      if (!abortController.signal.aborted) {
        timeout = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();
    return () => {
      abortController.abort();
      clearTimeout(timeout);
    };
  }, []);

  return { track };
}
