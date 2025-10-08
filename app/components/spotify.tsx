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

const MIN_HEIGHT_FOR_SPOTIFY = 900;
const POLL_INTERVAL = 60_000;

const SpotifyNowPlaying = () => {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const { load, isPlaying, play, pause, fade } = useAudioPlayer();

  const checkShouldShow = useCallback(() => {
    setShouldShow(
      window.innerWidth < 768 || window.innerHeight >= MIN_HEIGHT_FOR_SPOTIFY
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(checkShouldShow, 100);
    };

    // temp: until i get around to updating the layout entirely
    checkShouldShow();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [checkShouldShow]);

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
      // Silently fail - Spotify API errors shouldn't break the UI
    }
  }, [track?.id, load]);

  const getAlbumArt = () =>
    track?.image?.find((img) => img.size === "medium")?.["#text"] || "";

  const handlePlayPreview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) {
      return;
    }

    // add fade out logic as well? ran into weird playback issues in first attempt
    if (isPlaying) {
      pause();
    } else {
      play();
      fade(0, 0.2, 500);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!shouldShow) {
      return;
    }

    const poll = () => {
      fetchTrack();
      pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => clearTimeout(pollTimeoutRef.current);
  }, [fetchTrack, shouldShow]);

  if (!(track && shouldShow)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 w-full px-6 md:bottom-28">
      <div className="mx-auto max-w-sm">
        <div className="relative">
          <a
            className={`group flex items-center gap-4 rounded-lg border border-amber-200/60 bg-amber-50/60 p-4 pr-16 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-amber-300/80 hover:bg-amber-50/90 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/60 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
            href={track.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="relative h-16 min-w-16">
              <Image
                alt={`${track.album} album art`}
                className="rounded-md object-cover"
                height={64}
                onLoad={() => setTimeout(() => setIsVisible(true), 1)}
                src={getAlbumArt()}
                width={64}
              />
              {track.isPlaying && isVisible && (
                <div className="-bottom-2 -right-2 absolute flex items-end gap-[2px] rounded-md bg-amber-50/95 p-1.5 shadow-sm dark:bg-neutral-900/90">
                  <div className="h-3 w-[3px] origin-bottom animate-bar-1 bg-rose-700 dark:bg-rose-400/80" />
                  <div className="h-3 w-[3px] origin-bottom animate-bar-2 bg-rose-700 dark:bg-rose-400/80" />
                  <div className="h-3 w-[3px] origin-bottom animate-bar-3 bg-rose-700 dark:bg-rose-400/80" />
                </div>
              )}
            </div>
            <div className="mr-2 flex min-w-0 flex-1 flex-col">
              <span className="mb-0.5 text-rose-700 text-xs dark:text-rose-400/80">
                {track.isPlaying ? "currently listening to" : "last played"}
              </span>
              <span className="truncate font-medium text-amber-950 transition-colors group-hover:text-rose-700 dark:text-neutral-200 dark:group-hover:text-rose-400/80">
                {track.name}
              </span>
              <span className="truncate text-amber-900/80 text-sm dark:text-neutral-400">
                {track.artist}
              </span>
              <span className="truncate text-amber-800/70 text-sm dark:text-neutral-500">
                {track.album}
              </span>
            </div>
          </a>
          <button
            aria-label={isPlaying ? "Pause song preview" : "Play song preview"}
            className={`-translate-y-1/2 absolute top-1/2 right-4 cursor-pointer rounded-full bg-rose-700/10 p-2.5 text-rose-700 transition-colors duration-300 hover:bg-rose-700/20 dark:bg-rose-500/10 dark:text-rose-400/80 dark:hover:bg-rose-500/20 ${isVisible ? "animate-fade-in" : "opacity-0"}`}
            onClick={handlePlayPreview}
            title={isPlaying ? "Pause Preview" : "Play Preview"}
            type="button"
          >
            {isPlaying ? (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                  fillRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  fillRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotifyNowPlaying;
