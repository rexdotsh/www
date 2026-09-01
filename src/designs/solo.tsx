import { useState } from "react";
import ParticleRose from "@/designs/particle-rose";
import { TheSentence } from "@/designs/sentence-core";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 2 — "solo"
 * the duet scheme, restaged: the rose takes center stage alone, and the
 * sentence delivers its lines from below. symmetric, poster-calm.
 */
export default function SoloDesign({ hostname }: { hostname: string }) {
  const { track } = useNowPlaying();
  const [touched, setTouched] = useState(false);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        {/* the rose, center stage */}
        <div className="rise flex flex-col items-center">
          <ParticleRose
            className="w-[min(58vw,330px)] md:w-[min(38vh,380px)]"
            onTouch={() => setTouched(true)}
          />
          <p
            aria-hidden="true"
            className={`mt-1 font-mono text-[#a29a89] text-[10px] italic transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-70"}`}
          >
            ( touch it )
          </p>
        </div>

        {/* the sentence, from below */}
        <div
          className="rise mt-10 max-w-3xl"
          style={{ animationDelay: "150ms" }}
        >
          <TheSentence
            className="text-[clamp(1.7rem,3.6vw,2.8rem)] leading-[1.25] tracking-[-0.01em]"
            hostname={hostname}
            track={track}
          />
        </div>
      </div>
    </main>
  );
}
