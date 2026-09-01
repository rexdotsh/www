import { TheSentence } from "@/designs/sentence-core";
import { getIdentity } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 2 — "one sentence"
 * the entire site is a single giant sentence. the important words are
 * links; hovering them peeks the thing they point at.
 */
export default function SentenceDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const { track } = useNowPlaying();

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      {/* wordmark */}
      <span className="absolute top-5 left-6 font-mono text-[#a29a89] text-[10px] uppercase tracking-[0.3em]">
        {identity.domain}
      </span>

      <div className="flex min-h-full items-center px-6 py-24 md:px-14">
        <TheSentence
          className="rise max-w-5xl text-[clamp(2.1rem,6.2vw,4.6rem)] leading-[1.18] tracking-[-0.01em]"
          hostname={hostname}
          track={track}
        />
      </div>

      {/* footnote */}
      <p className="absolute bottom-5 left-6 font-mono text-[#a29a89] text-[10px] uppercase tracking-[0.25em]">
        © {new Date().getFullYear()} — that's the whole site
      </p>
    </main>
  );
}
