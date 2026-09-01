import { lazy, Suspense, useEffect, useRef, useState } from "react";

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

const SpotifyPlayer = lazy(() => import("./spotify-player"));
const SPOTIFY_MEDIA_QUERY = "(max-width: 767px), (min-height: 900px)";
const POLL_INTERVAL = 60_000;

export default function SpotifyNowPlaying() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const trackIdRef = useRef<string>(undefined);

  useEffect(() => {
    const mediaQuery = window.matchMedia(SPOTIFY_MEDIA_QUERY);
    const updateVisibility = () => setShouldShow(mediaQuery.matches);

    updateVisibility();
    mediaQuery.addEventListener("change", updateVisibility);
    return () => mediaQuery.removeEventListener("change", updateVisibility);
  }, []);

  useEffect(() => {
    if (!shouldShow) {
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
  }, [shouldShow]);

  if (!(track && shouldShow)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <SpotifyPlayer previewUrl={previewUrl} track={track} />
    </Suspense>
  );
}
