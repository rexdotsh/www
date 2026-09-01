import { useState } from "react";
import ParticleRose from "@/designs/particle-rose";
import { getIdentity, getNavLinks } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 1 — "bloom"
 * the classic site, remastered: the rose rebuilt from ~700 glyph
 * particles with spring physics. scatter it, it finds its way home.
 */
export default function BloomDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const [touched, setTouched] = useState(false);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#f6f3ec] font-mono text-[#4a443b] selection:bg-[#ce2955] selection:text-[#f6f3ec]">
      {/* top chrome */}
      <h1 className="absolute top-5 left-5 text-[11px] uppercase tracking-[0.25em]">
        <span className="font-bold text-[#1f1b16]">{identity.name}</span>
        <span className="text-[#9b9284]"> — {identity.tagline}</span>
      </h1>
      <p className="absolute top-5 right-5 hidden text-[#9b9284] text-[11px] tabular-nums tracking-[0.25em] md:block">
        est. 2025
      </p>

      {/* the artwork */}
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center">
          <ParticleRose
            className="w-[min(88vw,520px)]"
            onTouch={() => setTouched(true)}
          />
          <p
            aria-hidden="true"
            className={`mt-2 text-[#9b9284] text-[11px] italic transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-70"}`}
          >
            ( touch it )
          </p>
        </div>
      </div>

      {/* bottom chrome */}
      <nav
        aria-label="primary"
        className="-translate-x-1/2 md:-translate-y-1/2 absolute bottom-14 left-1/2 flex items-center gap-6 md:top-1/2 md:bottom-auto md:left-5 md:translate-x-0 md:flex-col md:items-start md:gap-4"
      >
        {links.map(({ href, label }) => (
          <a
            className="text-[#4a443b] text-[11px] uppercase tracking-[0.25em] underline decoration-transparent underline-offset-4 transition-[color,text-decoration-color] duration-150 hover:text-[#ce2955] hover:decoration-[#ce2955]"
            href={href}
            key={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        ))}
      </nav>

      <p className="absolute bottom-5 left-5 hidden max-w-[40ch] truncate text-[#9b9284] text-[11px] tracking-[0.15em] md:block">
        {track
          ? `♫ ${track.artist} — ${track.name}`
          : `© ${new Date().getFullYear()}`}
      </p>
    </main>
  );
}
