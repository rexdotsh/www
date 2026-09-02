import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import TintStrips from "@/components/tint-strips";
import { sfx } from "@/lib/sfx";
import { useIdle } from "@/lib/use-idle";
import { useNowPlaying } from "@/lib/use-now-playing";
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

// each lift is the card's offsetHeight + 3 at a 390px viewport, so the
// caption clears the tab (7px above the card) by 12px. to re-measure, set
// data-peek-open on the word's .peek-trigger and read .peek-card.offsetHeight.
const LIFTS: Record<SentenceWord, string> = {
  name: "max-md:-translate-y-[50px]",
  builds: "max-md:-translate-y-[218px]",
  writes: "max-md:-translate-y-[66px]",
  garden: "max-md:-translate-y-[79px]",
  music: "max-md:-translate-y-[85px]",
  hi: "max-md:-translate-y-[66px]",
  resume: "max-md:-translate-y-[54px]",
};
const MUSIC_COMPACT_LIFT = "max-md:-translate-y-[73px]";

const VOLUME = 0.5;

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const { track, previewUrl } = useNowPlaying();
  const [word, setWord] = useState<SentenceWord | null>(null);
  const [cover, setCover] = useState(false);
  const [artFade, setArtFade] = useState(0);
  const fadedOutRef = useRef(false);
  const { isPlaying, play, pause, fade, getPosition, duration, setVolume } =
    usePreview(previewUrl, () => {
      setArtFade(0);
      setCover(false);
    });
  const [holding, setHolding] = useState(false);
  const idle = useIdle(40_000);
  const dozing = idle && !(word || isPlaying || cover);
  const wasDozingRef = useRef(false);

  useEffect(() => {
    if (wasDozingRef.current && !dozing) {
      sfx("stir");
    }
    wasDozingRef.current = dozing;
  }, [dozing]);

  const onWordHover = (next: SentenceWord | null) => {
    setWord(next);
    if (next) {
      // the sticky cover exists so the cursor can travel word -> rose;
      // touch has no journey, and the card links out directly
      setCover(next === "music" && window.matchMedia("(hover: hover)").matches);
    }
  };

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
    if (word) {
      return CAPTIONS[word];
    }
    if (holding) {
      return "( opening up )";
    }
    return dozing ? "( dozing )" : "( alive, technically )";
  })();

  const liftClass = word
    ? word === "music" && !track?.isPlaying
      ? MUSIC_COMPACT_LIFT
      : LIFTS[word]
    : "";

  return (
    <main className="fixed inset-0 overflow-y-auto paper paper-lit font-serif-display text-ink selection:bg-rose selection:text-paper">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between gap-8 px-7 pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-normal md:gap-14 md:px-12 md:py-16">
        <div className="sentence-root relative z-10 max-w-2xl md:flex-1">
          <TheSentence
            className="text-[clamp(1.9rem,8.6vw,2.5rem)] leading-[1.22] tracking-[-0.01em] md:text-[clamp(1.9rem,4.4vw,3.5rem)] md:leading-[1.2]"
            hostname={hostname}
            onWordHover={onWordHover}
            track={track}
            wordStagger
          />
        </div>

        <div
          // above the sentence on phones so the tap-catcher behind an open
          // card cannot swallow a tap meant for the rose
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
              doze={dozing}
              mode={mode}
              onHold={setHolding}
              onTap={onRoseTap}
              tappable={Boolean(
                previewUrl && (isPlaying || cover || word === "music")
              )}
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
