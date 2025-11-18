"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "react-use-audio-player";

type SpotifyTrack = {
  isPlaying: boolean;
  name: string;
  artist: string;
  album: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large";
  }>;
  url: string;
  id: string;
};

const POLL_INTERVAL = 60_000;

export default function SpotifyNowPlaying() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { load, isPlaying, play, pause, fade } = useAudioPlayer();

  const fetchTrack = useCallback(async () => {
    try {
      const trackRes = await fetch("/api/spotify/playing");
      const trackData: SpotifyTrack = await trackRes.json();
      if (!trackData) {
        return;
      }

      if (trackData.id !== track?.id) {
        const previewRes = await fetch(`/api/spotify/preview/${trackData.id}`);
        const { url } = await previewRes.json();
        if (url) {
          load(url, { html5: true });
        }
      }

      setTrack(trackData);
    } catch (_err) {
      // Silently fail
    }
  }, [track?.id, load]);

  const togglePlayback = () => {
    if (!track) return;
    if (isPlaying) {
      pause();
    } else {
      play();
      fade(0, 0.2, 500);
    }
  };

  useEffect(() => {
    const poll = () => {
      fetchTrack();
      pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => clearTimeout(pollTimeoutRef.current);
  }, [fetchTrack]);

  if (!track || !track.isPlaying) {
    return null;
  }

  // Duplicate text for seamless marquee
  const text = `LISTENING TO: ${track.name.toUpperCase()} — ${track.artist.toUpperCase()} — ${track.album.toUpperCase()} +++ `;
  const repeats = 10;

  return (
    <button
      type="button"
      onClick={togglePlayback}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-0 left-0 z-50 w-full overflow-hidden border-b border-border bg-background py-2 text-sm uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors"
    >
      <div
        className="animate-marquee whitespace-nowrap flex"
        style={{ animationPlayState: isHovered ? "paused" : "running" }}
      >
        {Array.from({ length: repeats }).map((_, i) => (
          <span
            key={i}
            className={`mx-4 ${isPlaying ? "text-accent" : "text-secondary"}`}
          >
            {text}
          </span>
        ))}
      </div>
    </button>
  );
}
