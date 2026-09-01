import { useEffect, useRef, useState } from "react";
import type { SpotifyTrack } from "@/components/spotify";

const POLL_INTERVAL = 60_000;

export interface NowPlayingState {
  previewUrl: string | null;
  track: SpotifyTrack | null;
}

/**
 * Polls /api/spotify/playing and resolves a preview url for the active track.
 * Shared by every design so each can render its own player.
 */
export function useNowPlaying(enabled = true): NowPlayingState {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const trackIdRef = useRef<string>(undefined);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const abortController = new AbortController();

    const fetchTrack = async () => {
      try {
        const trackResponse = await fetch("/api/spotify/playing", {
          signal: abortController.signal,
        });
        if (!trackResponse.ok) {
          return;
        }

        const trackData: SpotifyTrack | null = await trackResponse.json();
        setTrack(trackData);

        if (!trackData || trackData.id === trackIdRef.current) {
          return;
        }

        trackIdRef.current = trackData.id;
        setPreviewUrl(null);

        const previewResponse = await fetch(
          `/api/spotify/preview/${trackData.id}`,
          { signal: abortController.signal }
        );
        if (!previewResponse.ok) {
          return;
        }

        const preview = (await previewResponse.json()) as { url?: string };
        setPreviewUrl(preview.url ?? null);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPreviewUrl(null);
        }
      }
    };

    const poll = async () => {
      await fetchTrack();
      if (!abortController.signal.aborted) {
        timeout = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();
    return () => {
      abortController.abort();
      clearTimeout(timeout);
    };
  }, [enabled]);

  return { track, previewUrl };
}
