import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import TintStrips from "@/components/tint-strips";
import { type SpotifyTrack, useNowPlaying } from "@/lib/use-now-playing";
import { usePreview } from "@/lib/use-preview";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  component: Home,
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

const MODES: Record<SentenceWord, RoseMode> = {
  name: "shiver",
  builds: "cube",
  writes: "caret",
  garden: "garden",
  music: "art",
  hi: "hi",
  resume: "paper",
};

const CAPTIONS: Record<SentenceWord, string> = {
  name: "( flustered )",
  builds: "( assembling )",
  writes: "( waiting for the first word )",
  garden: "( becoming a garden )",
  music: "( keeping time )",
  hi: "( saying it back )",
  resume: "( pretending to be a document )",
};

const LIFTS: Record<SentenceWord, string> = {
  name: "max-md:-translate-y-[50px]",
  builds: "max-md:-translate-y-[218px]",
  writes: "max-md:-translate-y-[66px]",
  garden: "max-md:-translate-y-[79px]",
  music: "max-md:-translate-y-[85px]",
  hi: "max-md:-translate-y-[66px]",
  resume: "max-md:-translate-y-[50px]",
};
const MUSIC_COMPACT_LIFT = "max-md:-translate-y-[73px]";

// phones sit closer to the ear and get no room tone; keep the preview softer
const VOLUME = 0.5;
const VOLUME_TOUCH = 0.28;

const isTouch = () => window.matchMedia("(hover: none)").matches;

interface Preview {
  track: SpotifyTrack;
  url: string;
}

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const live = useNowPlaying();
  const [word, setWord] = useState<SentenceWord | null>(null);
  // while a preview is on, the page keeps to the track it started with; the
  // poll may catch me changing songs, and that must not cut the preview off
  const [preview, setPreview] = useState<Preview | null>(null);
  const track = preview?.track ?? live.track;
  const previewUrl = preview?.url ?? live.previewUrl;
  const [artFade, setArtFade] = useState(0);
  const fadedOutRef = useRef(false);
  const volumeRef = useRef(VOLUME);
  const { isPlaying, play, pause, fade, getPosition, duration, setVolume } =
    usePreview(previewUrl, () => {
      setArtFade(0);
      setPreview(null);
    });

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const interval = setInterval(() => {
      const total = duration || 30;
      const position = getPosition();
      setArtFade(Math.min(1, position / total));
      if (total - position < 6 && !fadedOutRef.current) {
        fadedOutRef.current = true;
        fade(volumeRef.current, 0, 5500);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, duration, getPosition, fade]);

  useEffect(() => {
    if (!(isPlaying && track)) {
      return;
    }
    const previous = document.title;
    document.title = `♫ ${track.name} · ${track.artist}`;
    return () => {
      document.title = previous;
    };
  }, [isPlaying, track]);

  // the rose wears the cover while the word is held (that comes from the
  // word's own mode) and while a preview is on
  const togglePreview = useCallback(() => {
    if (preview) {
      pause();
      setArtFade(0);
      setPreview(null);
      return;
    }
    if (!(live.track && live.previewUrl)) {
      return;
    }
    fadedOutRef.current = false;
    volumeRef.current = isTouch() ? VOLUME_TOUCH : VOLUME;
    setArtFade(0);
    setPreview({ track: live.track, url: live.previewUrl });
    setVolume(0);
    play();
    fade(0, volumeRef.current, 2000);
  }, [preview, live.track, live.previewUrl, pause, play, setVolume, fade]);

  const albumArt =
    track?.image.find((image) => image.size === "large")?.["#text"] ??
    track?.image.find((image) => image.size === "medium")?.["#text"] ??
    null;

  const mode = word ? MODES[word] : preview ? "art" : "rest";

  const caption = (() => {
    if (word === "music" || (!word && preview)) {
      if (preview) {
        return "( humming along )";
      }
      if (albumArt) {
        return previewUrl
          ? "( dressed as the cover, press play )"
          : "( dressed as the album cover )";
      }
      return CAPTIONS.music;
    }
    return word ? CAPTIONS[word] : "( alive, technically )";
  })();

  const liftClass = word
    ? word === "music" && !track?.isPlaying
      ? MUSIC_COMPACT_LIFT
      : LIFTS[word]
    : "";

  return (
    <main className="fixed inset-0 overflow-y-auto paper paper-lit font-serif-display text-ink selection:bg-rose selection:text-paper">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between gap-8 px-7 pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-normal md:gap-14 md:px-12 md:py-16">
        <div className="sentence-root relative max-w-2xl md:flex-1">
          <TheSentence
            className="text-[clamp(1.9rem,8.6vw,2.5rem)] leading-[1.22] tracking-[-0.01em] md:text-[clamp(1.9rem,4.4vw,3.5rem)] md:leading-[1.2]"
            hostname={hostname}
            onPreviewToggle={previewUrl ? togglePreview : undefined}
            onWordHover={setWord}
            previewPlaying={preview !== null}
            track={track}
            wordStagger
          />
        </div>

        <div
          className="rise relative z-20 flex shrink-0 flex-col items-center md:z-auto"
          style={{ animationDelay: "200ms" }}
        >
          <div
            className={`flex flex-col items-center transition-transform duration-300 ease-strong ${liftClass}`}
          >
            <ParticleRose
              artFade={artFade}
              artUrl={albumArt}
              className="w-[min(64vw,300px)] md:w-[min(34vw,440px)]"
              mode={mode}
            />
            <p
              aria-hidden="true"
              className="mt-2.5 h-4 font-mono text-faint text-[10px] italic"
            >
              <span className="swap-in" key={caption}>
                {caption}
              </span>
            </p>
          </div>
        </div>
      </div>
      <TintStrips />
    </main>
  );
}
