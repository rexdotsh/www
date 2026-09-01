import { useEffect, useRef, useState } from "react";
import ParticleRose, { type RoseMode } from "@/designs/particle-rose";
import { TheSentence, type SentenceWord } from "@/designs/sentence-core";
import { useNowPlaying } from "@/lib/use-now-playing";

/** which word conducts which movement */
const MODES: Record<SentenceWord, RoseMode> = {
  name: "shiver",
  builds: "grid",
  writes: "lean",
  garden: "bloom",
  music: "pulse",
  hi: "sway",
  resume: "grid",
};

const CAPTIONS: Record<SentenceWord, string> = {
  name: "( flustered )",
  builds: "( ordering itself )",
  writes: "( leaning italic )",
  garden: "( in bloom )",
  music: "( keeping time )",
  hi: "( waving back )",
  resume: "( looking presentable )",
};

const MAGNET_RADIUS = 110;
const MAGNET_PULL = 0.22;
const MAGNET_MAX = 5;

/**
 * design 3 — "encore"
 * the duet, conducted. every word you hover changes how the rose
 * behaves — it orders itself for "builds", leans italic for "writes",
 * blooms for "garden", keeps time for "music", waves for "say hi",
 * and gets flustered when you hover the name. the sentence typesets
 * itself word by word, and the link words lean toward your cursor.
 */
export default function EncoreDesign({ hostname }: { hostname: string }) {
  const { track } = useNowPlaying();
  const [word, setWord] = useState<SentenceWord | null>(null);
  const sentenceRef = useRef<HTMLDivElement>(null);

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
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-14 md:px-12">
        {/* the sentence, typesetting itself */}
        <div className="order-2 max-w-2xl flex-1 md:order-1" ref={sentenceRef}>
          <TheSentence
            className="text-[clamp(1.9rem,4.4vw,3.5rem)] leading-[1.2] tracking-[-0.01em]"
            hostname={hostname}
            onWordHover={setWord}
            track={track}
            wordStagger
          />
        </div>

        {/* the rose, conducted by the words */}
        <div
          className="rise order-1 flex shrink-0 flex-col items-center md:order-2"
          style={{ animationDelay: "200ms" }}
        >
          <ParticleRose
            className="w-[min(62vw,240px)] md:w-[min(32vw,420px)]"
            mode={word ? MODES[word] : "breathe"}
          />
          <p
            aria-hidden="true"
            className="mt-1 h-4 font-mono text-[#a29a89] text-[10px] italic"
          >
            <span
              className="inline-block transition-opacity duration-300"
              key={word ?? "idle"}
            >
              {word ? CAPTIONS[word] : "( touch it — or read to it )"}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
