import { useState } from "react";
import ParticleRose from "@/designs/particle-rose";
import { TheSentence } from "@/designs/sentence-core";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 1 — "duet"
 * the giant sentence carries the words, the particle rose carries the
 * play. two instruments, one quiet room.
 */
export default function DuetDesign({ hostname }: { hostname: string }) {
  const { track } = useNowPlaying();
  const [touched, setTouched] = useState(false);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center gap-10 px-6 py-16 md:flex-row md:gap-14 md:px-12">
        {/* the sentence */}
        <div className="rise order-2 max-w-2xl flex-1 md:order-1">
          <TheSentence
            className="text-[clamp(1.9rem,4.4vw,3.5rem)] leading-[1.2] tracking-[-0.01em]"
            hostname={hostname}
            track={track}
          />
        </div>

        {/* the rose */}
        <div
          className="rise order-1 flex shrink-0 flex-col items-center md:order-2"
          style={{ animationDelay: "150ms" }}
        >
          <ParticleRose
            className="w-[min(62vw,240px)] md:w-[min(30vw,400px)]"
            onTouch={() => setTouched(true)}
          />
          <p
            aria-hidden="true"
            className={`mt-1 font-mono text-[#a29a89] text-[10px] italic transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-70"}`}
          >
            ( touch it )
          </p>
        </div>
      </div>
    </main>
  );
}
