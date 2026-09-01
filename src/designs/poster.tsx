import ParticleRose from "@/designs/particle-rose";
import { TheSentence } from "@/designs/sentence-core";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 3 — "poster"
 * the duet scheme, collapsed into one plane: the rose becomes a faint
 * full-bleed particle field and the sentence floats on top of it.
 * moving through the text stirs the petals behind it.
 */
export default function PosterDesign({ hostname }: { hostname: string }) {
  const { track } = useNowPlaying();

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      {/* the field */}
      <div className="fixed inset-0 flex items-center justify-center">
        <ParticleRose className="w-[min(92vmin,760px)]" dim={0.3} />
      </div>

      {/* the sentence, floating over it */}
      <div className="relative z-10 flex min-h-full items-center px-6 py-16 md:px-16">
        <div className="rise max-w-4xl">
          <TheSentence
            className="text-[clamp(2.1rem,5.4vw,4.2rem)] leading-[1.18] tracking-[-0.01em]"
            hostname={hostname}
            track={track}
          />
        </div>
      </div>
    </main>
  );
}
