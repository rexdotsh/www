import { useEffect, useRef, useState } from "react";
import { createSuperHover } from "super-hover";
import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const RED = "#ff1f56";

/**
 * design 3 — "brutalist"
 * a swiss poster with the grid left showing. one typeface, one accent,
 * printed-matter details: tickers, crop marks, a barcode, a live clock.
 */
export default function BrutalistDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = tableRef.current;
    if (!root) {
      return;
    }
    const superHover = createSuperHover({ root });
    return () => superHover.destroy();
  }, []);

  const tickerItems = [
    NOW.doing,
    track ? `now playing: ${track.artist} — ${track.name}` : NOW.location,
    "est. 2025",
    "personal site",
  ];

  return (
    <main className="poster-grid relative min-h-dvh bg-[#ececec] font-grotesk text-[#0a0a0a] selection:bg-[#0a0a0a] selection:text-[#ececec]">
      {/* crop marks */}
      <CropMark className="top-2 left-2" />
      <CropMark className="top-2 right-2" />
      <CropMark className="bottom-2 left-2" />
      <CropMark className="bottom-2 right-2" />

      {/* vertical rail */}
      <span className="-rotate-90 fixed top-1/2 left-0 hidden origin-center translate-x-[-38%] text-[10px] uppercase tracking-[0.5em] opacity-40 2xl:block">
        {identity.tagline} — est. 2025
      </span>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col border-[#0a0a0a] border-x-2 bg-[#ececec]">
        {/* thin top ticker */}
        <div
          aria-hidden="true"
          className="rise overflow-hidden border-[#0a0a0a] border-b-2 bg-[#0a0a0a] py-1"
        >
          <div className="marquee-track-reverse flex w-max whitespace-nowrap text-[#ececec] text-[10px] uppercase tracking-[0.3em]">
            {[0, 1].map((copy) => (
              <span className="flex" key={copy}>
                {Array.from({ length: 6 }, (_, i) => (
                  <span className="px-8" key={i}>
                    {identity.name}.wf — printed matter, digital edition
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* top bar */}
        <header className="rise grid grid-cols-2 border-[#0a0a0a] border-b-2 md:grid-cols-3">
          <span className="border-[#0a0a0a] border-r-2 p-3 font-bold text-sm uppercase tracking-widest">
            {identity.name}®
          </span>
          <span className="hidden items-center p-3 text-sm uppercase tracking-widest md:flex md:border-[#0a0a0a] md:border-r-2">
            {identity.tagline}
          </span>
          <span className="flex items-center justify-end p-3 text-sm tabular-nums tracking-widest">
            n°01 — {new Date().getFullYear()}
          </span>
        </header>

        {/* giant name, with outline echo */}
        <section
          className="rise relative overflow-hidden border-[#0a0a0a] border-b-2 px-2 py-5 md:py-8"
          style={{ animationDelay: "70ms" }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center px-2 font-grotesk-black text-[clamp(5rem,23vw,16rem)] uppercase leading-[0.82] tracking-[-0.03em]"
            style={{
              WebkitTextStroke: "2px #0a0a0a",
              color: "transparent",
              transform: "translate(8px, 8px)",
              opacity: 0.25,
            }}
          >
            {identity.name}
          </span>
          <h1 className="relative select-none text-center font-grotesk-black text-[clamp(5rem,23vw,16rem)] uppercase leading-[0.82] tracking-[-0.03em]">
            {identity.name}
          </h1>
          <img
            alt=""
            aria-hidden="true"
            className="-rotate-12 pointer-events-none absolute right-[5%] bottom-[-10%] w-24 select-none mix-blend-multiply [filter:contrast(1.15)_saturate(1.3)] md:w-40"
            height="320"
            src="/rose.avif"
            width="320"
          />
        </section>

        {/* red ticker */}
        <div
          aria-hidden="true"
          className="rise overflow-hidden border-[#0a0a0a] border-b-2 py-2"
          style={{ animationDelay: "140ms", backgroundColor: RED }}
        >
          <div className="marquee-track flex w-max whitespace-nowrap font-bold text-[#0a0a0a] text-sm uppercase tracking-[0.2em]">
            {[0, 1].map((copy) => (
              <span className="flex" key={copy}>
                {tickerItems.map((item) => (
                  <span className="px-6" key={item}>
                    {item} <span className="px-4">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* nav grid with ghost numerals */}
        <nav
          aria-label="primary"
          className="rise grid grid-cols-2 md:grid-cols-4"
          style={{ animationDelay: "210ms" }}
        >
          {links.map(({ href, label }, index) => (
            <a
              className="group relative overflow-hidden border-[#0a0a0a] border-b-2 p-4 uppercase transition-colors duration-100 odd:border-r-2 hover:bg-[#0a0a0a] hover:text-[#ececec] md:border-r-2 md:p-5 md:last:border-r-0"
              href={href}
              key={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-[-1.2rem] right-[-0.4rem] select-none font-grotesk-black text-[6rem] leading-none opacity-[0.07] transition-opacity duration-100 group-hover:opacity-20"
              >
                {index + 1}
              </span>
              <span className="block text-[#0a0a0a]/40 text-xs tabular-nums transition-colors duration-100 group-hover:text-[#ececec]/40">
                0{index + 1}
              </span>
              <span className="mt-8 block font-bold text-xl tracking-tight md:mt-12 md:text-2xl">
                {label}
                <span
                  className="ml-1 inline-block transition-transform duration-150 ease-strong group-hover:translate-x-1.5"
                  style={{ color: RED }}
                >
                  →
                </span>
              </span>
            </a>
          ))}
        </nav>

        {/* projects table */}
        <section className="rise" style={{ animationDelay: "280ms" }}>
          <h2 className="flex items-center justify-between border-[#0a0a0a] border-b-2 p-3 font-bold text-sm uppercase tracking-[0.25em]">
            <span>index / selected work</span>
            <span className="hidden text-xs opacity-40 md:block">
              {PROJECTS.length} entries
            </span>
          </h2>
          <div ref={tableRef}>
            {PROJECTS.map((project, index) => (
              <a
                className="group flex items-baseline gap-4 border-[#0a0a0a] border-b-2 px-3 py-4 transition-colors duration-100 data-[super-hover-active]:bg-[#0a0a0a] data-[super-hover-active]:text-[#ececec] md:px-5"
                data-super-hover
                href={project.href}
                key={project.name}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="w-10 shrink-0 text-sm tabular-nums opacity-40">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="w-40 shrink-0 font-bold text-lg uppercase tracking-tight md:w-56 md:text-xl">
                  {project.name}
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-sm md:block">
                  {project.description}
                </span>
                <span
                  className="shrink-0 text-sm uppercase"
                  style={{ color: RED }}
                >
                  {project.year}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* writing strip */}
        <section className="rise" style={{ animationDelay: "350ms" }}>
          <h2 className="border-[#0a0a0a] border-b-2 p-3 font-bold text-sm uppercase tracking-[0.25em]">
            writing — blog.rex.wf
          </h2>
          <div className="grid md:grid-cols-3">
            {POSTS.map((post) => (
              <a
                className="border-[#0a0a0a] border-b-2 p-4 transition-colors duration-100 md:border-r-2 md:last:border-r-0 md:hover:bg-[#0a0a0a] md:hover:text-[#ececec]"
                href={post.href}
                key={post.title}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="block text-xs tabular-nums opacity-40">
                  {post.date}
                </span>
                <span className="mt-2 block font-bold leading-snug">
                  {post.title}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* footer meta */}
        <footer
          className="rise mt-auto grid grid-cols-2 items-stretch text-xs uppercase tracking-widest md:grid-cols-4"
          style={{ animationDelay: "420ms" }}
        >
          <span className="flex items-center border-[#0a0a0a] border-r-2 p-3">
            © {new Date().getFullYear()}
          </span>
          <span className="flex items-center p-3 md:border-[#0a0a0a] md:border-r-2">
            <UtcClock />
          </span>
          <span className="hidden items-center border-[#0a0a0a] border-r-2 p-3 md:flex">
            built w/ tanstack
          </span>
          <span className="hidden items-center justify-end p-3 md:flex">
            <Barcode />
          </span>
        </footer>
      </div>
    </main>
  );
}

function CropMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none fixed select-none text-[#0a0a0a]/40 text-xs ${className}`}
    >
      +
    </span>
  );
}

function UtcClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        `${new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        })} utc`
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="tabular-nums">{time ?? "--:--:-- utc"}</span>;
}

function Barcode() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-6 w-24"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #0a0a0a 0 2px, transparent 2px 4px, #0a0a0a 4px 7px, transparent 7px 9px, #0a0a0a 9px 10px, transparent 10px 14px)",
      }}
    />
  );
}
