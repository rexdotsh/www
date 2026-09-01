import { useEffect } from "react";
import { useAudioPlayer } from "react-use-audio-player";
import type { SpotifyTrack } from "./spotify";

interface SpotifyPlayerProps {
  previewUrl: string | null;
  track: SpotifyTrack;
}

export default function SpotifyPlayer({
  previewUrl,
  track,
}: SpotifyPlayerProps) {
  const { load, isPlaying, play, pause, fade } = useAudioPlayer();
  const albumArt =
    track.image.find((image) => image.size === "medium")?.["#text"] ?? "";

  useEffect(() => {
    if (previewUrl) {
      load(previewUrl, { html5: true });
    }
  }, [load, previewUrl]);

  const handlePlayPreview = () => {
    if (!previewUrl) {
      return;
    }

    if (isPlaying) {
      pause();
    } else {
      play();
      fade(0, 0.2, 500);
    }
  };

  const previewLabel = previewUrl
    ? isPlaying
      ? "Pause song preview"
      : "Play song preview"
    : "Song preview unavailable";

  return (
    <div
      className="fixed inset-x-0 bottom-[var(--spotify-bottom)] z-10 w-full px-6 md:bottom-[calc(7rem+env(safe-area-inset-bottom,0px))]"
      style={{
        ["--spotify-bottom" as string]:
          "calc(1.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto max-w-sm">
        <div className="relative">
          <a
            className="fade-in group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 pr-16 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-border-hover hover:bg-surface-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            href={track.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="relative h-16 min-w-16">
              <img
                alt={`${track.album} album art`}
                className="rounded-md object-cover"
                decoding="async"
                height={64}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={albumArt}
                width={64}
              />
              {track.isPlaying ? (
                <div className="-bottom-2 -right-2 absolute flex items-end gap-[2px] rounded-md bg-surface-hover p-1.5 shadow-sm">
                  <div className="h-3 w-[3px] origin-bottom animate-bar-1 bg-accent" />
                  <div className="h-3 w-[3px] origin-bottom animate-bar-2 bg-accent" />
                  <div className="h-3 w-[3px] origin-bottom animate-bar-3 bg-accent" />
                </div>
              ) : null}
            </div>
            <div className="mr-2 flex min-w-0 flex-1 flex-col">
              <span className="mb-0.5 text-accent text-xs">
                {track.isPlaying ? "currently listening to" : "last played"}
              </span>
              <span className="truncate font-medium text-[#451a03] transition-colors group-hover:text-accent dark:text-[#e5e5e5]">
                {track.name}
              </span>
              <span className="truncate text-[#78350fcc] text-sm dark:text-[#a3a3a3]">
                {track.artist}
              </span>
              <span className="truncate text-secondary text-sm">
                {track.album}
              </span>
            </div>
          </a>
          <button
            aria-label={previewLabel}
            className="-translate-y-1/2 fade-in absolute top-1/2 right-4 cursor-pointer rounded-full bg-accent/10 p-2.5 text-accent transition-colors duration-300 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!previewUrl}
            onClick={handlePlayPreview}
            title={previewLabel}
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
}
