import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

/** which word conducts which movement */
const MODES: Record<SentenceWord, RoseMode> = {
  name: "shiver",
  builds: "grid",
  writes: "lean",
  garden: "garden",
  music: "art",
  hi: "wave",
  resume: "lines",
};

const CAPTIONS: Record<SentenceWord, string> = {
  name: "( flustered )",
  builds: "( ordering itself )",
  writes: "( leaning italic )",
  garden: "( becoming a garden )",
  music: "( keeping time )",
  hi: "( waving hello )",
  resume: "( pretending to be a document )",
};

const MAGNET_RADIUS = 110;
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 5;

/**
 * the site: one persona-aware sentence and a rose made of ~700 glyph
 * particles. every word you hover conducts the rose — it orders itself
 * for "builds", leans italic for "writes", becomes a garden for
 * "garden", dresses as the album cover for "music", waves for "say hi",
 * and gets flustered when you hover the name.
 */
function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const { track } = useNowPlaying();
  const [word, setWord] = useState<SentenceWord | null>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);

  const albumArt =
    track?.image.find((image) => image.size === "large")?.["#text"] ??
    track?.image.find((image) => image.size === "medium")?.["#text"] ??
    null;

  const caption = (() => {
    if (!word) {
      return "( touch it — or read to it )";
    }
    if (word === "music" && albumArt) {
      return "( dressed as the album cover )";
    }
    return CAPTIONS[word];
  })();

  // magnetic link words — they lean toward a nearby cursor
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      return;
    }
    const container = sentenceRef.current;
    if (!container) {
      return;
    }

    const anchors = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("a.peek-trigger")
    );
    for (const anchor of anchors) {
      anchor.style.transition =
        "translate 200ms cubic-bezier(0.23, 1, 0.32, 1)";
    }

    const onPointerMove = (event: PointerEvent) => {
      for (const anchor of anchors) {
        const rect = anchor.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < MAGNET_RADIUS) {
          const strength = (1 - dist / MAGNET_RADIUS) * MAGNET_PULL;
          const tx = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dx * strength));
          const ty = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dy * strength));
          anchor.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;
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
        {/* the sentence, typesetting itself */}
        <div
          className="sentence-root relative z-10 max-w-2xl md:flex-1"
          ref={sentenceRef}
        >
          <TheSentence
            className="text-[clamp(1.9rem,8.6vw,2.5rem)] leading-[1.22] tracking-[-0.01em] md:text-[clamp(1.9rem,4.4vw,3.5rem)] md:leading-[1.2]"
            hostname={hostname}
            onWordHover={setWord}
            track={track}
            wordStagger
          />
        </div>

        {/* the rose, conducted by the words */}
        <div
          className="rise flex shrink-0 flex-col items-center"
          style={{ animationDelay: "200ms" }}
        >
          {/* on phones the peek docks at the bottom — the rose steps
              up out of its way while a word is armed */}
          <div
            className={`flex flex-col items-center transition-transform duration-300 ease-strong ${word ? "max-md:-translate-y-16" : ""}`}
          >
            <ParticleRose
              artUrl={albumArt}
              className="w-[min(64vw,300px)] md:w-[min(34vw,440px)]"
              mode={word ? MODES[word] : "rest"}
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
