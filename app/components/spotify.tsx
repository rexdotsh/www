"use client";

import Image from "next/image";
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
  const [isVisible, setIsVisible] = useState(false);
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

  const getAlbumArt = () =>
    track?.image?.find((img) => img.size === "medium")?.["#text"] || "";

  const handlePlayPreview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;

    if (isPlaying) {
      pause();
    } else {
      play();
      fade(0, 0.2, 500);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const poll = () => {
      fetchTrack();
      pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => clearTimeout(pollTimeoutRef.current);
  }, [fetchTrack]);

  if (!track) {
    // Placeholder or empty state
    return (
      <div className="w-full border border-border p-4 font-mono text-xs text-gray-400">
        Waiting for signal...
      </div>
    );
  }

  return (
    <div className="w-full group">
      <div
        className={`w-full border border-border p-4 transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex gap-4 items-start">
          <div className="relative h-16 w-16 flex-shrink-0 grayscale contrast-125">
            <Image
              alt={`${track.album} album art`}
              className="object-cover border border-border"
              height={64}
              onLoad={() => setIsVisible(true)}
              src={getAlbumArt()}
              width={64}
            />
            {track.isPlaying && (
              <div className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full animate-pulse" />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-lg leading-tight hover:underline truncate"
            >
              {track.name}
            </a>
            <span className="font-mono text-xs text-gray-500 truncate mt-1">
              {track.artist}
            </span>
            <span className="font-mono text-[10px] text-gray-400 truncate uppercase">
              {track.album}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-2">
          <span className="font-mono text-[10px] uppercase">
            Status: {track.isPlaying ? "Live" : "Paused"}
          </span>

          <button
            type="button"
            onClick={handlePlayPreview}
            className="font-mono text-[10px] uppercase hover:bg-accent hover:text-white px-2 py-0.5 transition-colors cursor-pointer"
          >
            [{isPlaying ? "Stop" : "Play"}]
          </button>
        </div>
      </div>
    </div>
  );
}
