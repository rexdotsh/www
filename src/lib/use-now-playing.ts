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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let previewId: string | undefined;
    const abortController = new AbortController();

    const poll = async () => {
      try {
        const response = await fetch("/api/spotify/playing", {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = (await response.json()) as SpotifyTrack | null;
          setTrack((current) =>
            current?.id === data?.id && current?.isPlaying === data?.isPlaying
              ? current
              : data
          );
          if (data && data.id !== previewId) {
            previewId = data.id;
            setPreviewUrl(null);
            const preview = await fetch(`/api/spotify/preview/${data.id}`, {
              signal: abortController.signal,
            });
            if (preview.ok) {
              const { url } = (await preview.json()) as { url?: string };
              setPreviewUrl(url ?? null);
            }
          }
        }
      } catch {
        // ignore aborts and network hiccups; next poll retries
      }
      if (!abortController.signal.aborted) {
        timeout = setTimeout(poll, POLL_INTERVAL);
      }
    };

    // pause polling while the tab is hidden; resume fresh on return
    const onVisibility = () => {
      clearTimeout(timeout);
      if (!document.hidden) {
        poll();
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
