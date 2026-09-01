import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "react-use-audio-player";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import { useNowPlaying } from "@/lib/use-now-playing";

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
  name: "max-md:-translate-y-[53px]",
  builds: "max-md:-translate-y-[224px]",
  writes: "max-md:-translate-y-[150px]",
  garden: "max-md:-translate-y-[66px]",
  music: "max-md:-translate-y-[78px]",
  hi: "max-md:-translate-y-[54px]",
  resume: "max-md:-translate-y-[54px]",
};
const MUSIC_COMPACT_LIFT = "max-md:-translate-y-[64px]";

const MAGNET_RADIUS = 110;
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 5;

const VOLUME = 0.5;

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const { track, previewUrl } = useNowPlaying();
  const {
    load,
    isPlaying,
    play,
    pause,
    fade,
    getPosition,
    duration,
    setVolume,
  } = useAudioPlayer();
  const [word, setWord] = useState<SentenceWord | null>(null);
  const [cover, setCover] = useState(false);
  const [artFade, setArtFade] = useState(0);
  const sentenceRef = useRef<HTMLDivElement>(null);
  const fadedOutRef = useRef(false);

  const onWordHover = (next: SentenceWord | null) => {
    setWord(next);
    if (next) {
      setCover(next === "music");
    }
  };

  useEffect(() => {
    if (previewUrl) {
      load(previewUrl, {
        html5: true,
        initialVolume: 0,
        onend: () => {
          setArtFade(0);
          setCover(false);
        },
      });
    }
  }, [load, previewUrl]);

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
        fade(VOLUME, 0, 5500);
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

  const onRoseTap = () => {
    if (!previewUrl) {
      return;
    }
    if (isPlaying) {
      pause();
    } else if (word === "music" || cover) {
      fadedOutRef.current = false;
      setArtFade(0);
      setVolume(0);
      play();
      fade(0, VOLUME, 2000);
    }
  };

  const albumArt =
    track?.image.find((image) => image.size === "large")?.["#text"] ??
    track?.image.find((image) => image.size === "medium")?.["#text"] ??
    null;

  const mode = word ? MODES[word] : isPlaying || cover ? "art" : "rest";

  const caption = (() => {
    if (word === "music" || (!word && (isPlaying || cover))) {
      if (isPlaying) {
        return "( humming along )";
      }
      if (albumArt) {
        return previewUrl
          ? "( dressed as the cover, tap to listen )"
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

  useEffect(() => {
    const container = sentenceRef.current;
    if (
      !container ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>(".peek-trigger")
    );
    for (const anchor of anchors) {
      anchor.style.transition = "translate 200ms cubic-bezier(0.23,1,0.32,1)";
    }

    const onPointerMove = (event: PointerEvent) => {
      for (const anchor of anchors) {
        const rect = anchor.getBoundingClientRect();
        const dx = event.clientX - rect.left - rect.width / 2;
        const dy = event.clientY - rect.top - rect.height / 2;
        const dist = Math.hypot(dx, dy);
        if (dist < MAGNET_RADIUS) {
          const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_PULL;
          const clamp = (n: number) =>
            Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, n)).toFixed(1);
          anchor.style.translate = `${clamp(dx * pull)}px ${clamp(dy * pull)}px`;
        } else if (anchor.style.translate !== "0px 0px") {
          anchor.style.translate = "0px 0px";
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      for (const anchor of anchors) {
        anchor.style.translate = "";
        anchor.style.transition = "";
      }
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between gap-8 px-7 pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-normal md:gap-14 md:px-12 md:py-16">
        <div
          className="sentence-root relative z-10 max-w-2xl md:flex-1"
          ref={sentenceRef}
        >
          <TheSentence
            className="text-[clamp(1.75rem,7.9vw,2.3rem)] leading-[1.18] tracking-[-0.01em] max-md:text-justify md:text-[clamp(1.9rem,4.4vw,3.5rem)] md:leading-[1.2]"
            hostname={hostname}
            onWordHover={onWordHover}
            track={track}
            wordStagger
          />
        </div>

        <div
          className="rise flex shrink-0 flex-col items-center"
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
              onTap={onRoseTap}
              tappable={Boolean(
                previewUrl && (isPlaying || cover || word === "music")
              )}
            />
            <p
              aria-hidden="true"
              className="mt-2.5 h-4 font-mono text-[#a29a89] text-[10px] italic"
            >
              <span
                className="inline-block transition-opacity duration-300"
                key={caption}
              >
                {caption}
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
