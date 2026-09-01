import { useEffect, useRef } from "react";
import { createSuperHover } from "super-hover";
import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const RED = "#ff1f56";

/**
 * design 3 — "brutalist"
 * a swiss poster with the grid left showing. one typeface, one accent,
 * everything oversized and honest.
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
    <main className="min-h-dvh bg-[#ececec] font-grotesk text-[#0a0a0a] selection:bg-[#0a0a0a] selection:text-[#ececec]">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col border-[#0a0a0a] border-x-2">
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

        {/* giant name */}
        <section
          className="rise relative overflow-hidden border-[#0a0a0a] border-b-2 px-2 py-4 md:py-6"
          style={{ animationDelay: "70ms" }}
        >
          <h1 className="select-none text-center font-grotesk-black text-[clamp(5rem,24vw,17rem)] uppercase leading-[0.82] tracking-[-0.03em]">
            {identity.name}
          </h1>
          <img
            alt=""
            aria-hidden="true"
            className="-rotate-12 pointer-events-none absolute right-[6%] bottom-[-8%] w-24 select-none opacity-90 md:w-36"
            height="320"
            src="/rose.avif"
            width="320"
          />
        </section>

        {/* ticker */}
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

        {/* nav grid */}
        <nav
          aria-label="primary"
          className="rise grid grid-cols-2 md:grid-cols-4"
          style={{ animationDelay: "210ms" }}
        >
          {links.map(({ href, label }, index) => (
            <a
              className="group border-[#0a0a0a] border-b-2 p-4 uppercase transition-colors duration-100 hover:bg-[#0a0a0a] hover:text-[#ececec] odd:border-r-2 md:border-r-2 md:p-5 md:last:border-r-0"
              href={href}
              key={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="block text-[#0a0a0a]/40 text-xs tabular-nums transition-colors duration-100 group-hover:text-[#ececec]/40">
                0{index + 1}
              </span>
              <span className="mt-4 block font-bold text-xl tracking-tight md:mt-8 md:text-2xl">
                {label}
                <span
                  className="ml-1 inline-block transition-transform duration-150 ease-strong group-hover:translate-x-1"
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
          <h2 className="border-[#0a0a0a] border-b-2 p-3 font-bold text-sm uppercase tracking-[0.25em]">
            index / selected work
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
                className="border-[#0a0a0a] border-b-2 p-4 transition-colors duration-100 hover:text-[#ececec] md:border-r-2 md:last:border-r-0 md:hover:bg-[#0a0a0a]"
                href={post.href}
                key={post.title}
                rel="noopener noreferrer"
                style={{ backgroundColor: "transparent" }}
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
          className="rise mt-auto grid grid-cols-2 text-xs uppercase tracking-widest md:grid-cols-4"
          style={{ animationDelay: "420ms" }}
        >
          <span className="border-[#0a0a0a] border-r-2 p-3">
            © {new Date().getFullYear()}
          </span>
          <span className="p-3 md:border-[#0a0a0a] md:border-r-2">
            {NOW.prompt}
          </span>
          <span className="hidden border-[#0a0a0a] border-r-2 p-3 md:block">
            built w/ tanstack
          </span>
          <span
            className="hidden p-3 text-right md:block"
            style={{ color: RED }}
          >
            ✦ no cookies
          </span>
        </footer>
      </div>
    </main>
  );
}
