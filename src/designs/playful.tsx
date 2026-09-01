import { useRef } from "react";
import { motion } from "motion/react";
import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

const CANDY = ["#ffd6e0", "#d6f0ff", "#e3ffd6", "#fff3c4"];
const TILTS = ["-1.5deg", "1deg", "-0.75deg", "1.5deg", "-1deg", "0.75deg"];

/**
 * design 5 — "playful"
 * a sticker garden. squishy buttons, tilted cards, and a rose you can
 * pick up and throw around.
 */
export default function PlayfulDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const heroRef = useRef<HTMLDivElement>(null);
  const albumArt =
    track?.image.find((image) => image.size === "medium")?.["#text"] ?? "";

  return (
    <main className="dotted-paper min-h-dvh bg-[#fff6ee] px-6 py-14 font-round text-[#2b2118] selection:bg-[#ff5d8f] selection:text-white md:py-20">
      <div className="mx-auto w-full max-w-xl">
        {/* hero */}
        <section className="relative text-center" ref={heroRef}>
          <motion.img
            alt="A rose sticker — grab it!"
            className="mx-auto w-40 cursor-grab select-none touch-none [filter:drop-shadow(0_0_0_white)_drop-shadow(0_0_2px_white)_drop-shadow(0_0_2px_white)_drop-shadow(0_6px_14px_rgba(43,33,24,0.25))] active:cursor-grabbing md:w-48"
            drag
            dragConstraints={heroRef}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
            height="320"
            src="/rose.avif"
            whileDrag={{ scale: 1.08, rotate: 6 }}
            whileHover={{ rotate: -4 }}
            whileTap={{ scale: 0.96 }}
            width="320"
          />
          <h1 className="rise mt-8 font-bold text-[clamp(2.4rem,9vw,3.6rem)] leading-[1.05] tracking-tight">
            hi, i'm {identity.name}{" "}
            <span aria-hidden="true" className="inline-block text-[#ff5d8f]">
              ☺
            </span>
          </h1>
          <p
            className="rise mx-auto mt-3 max-w-sm text-[#7a6a58] text-lg"
            style={{ animationDelay: "90ms" }}
          >
            {identity.tagline}. the rose is draggable, obviously.
          </p>

          {/* candy nav */}
          <nav
            aria-label="primary"
            className="rise mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            {links.map(({ href, label }, index) => (
              <a
                className="rounded-full border-2 border-[#2b2118] px-5 py-2.5 font-bold text-sm shadow-[3px_3px_0_#2b2118] transition-[transform,box-shadow] duration-150 ease-strong hover:[transform:translate(-2px,-2px)] hover:shadow-[5px_5px_0_#2b2118] active:[transform:translate(2px,2px)] active:shadow-[0px_0px_0_#2b2118]"
                href={href}
                key={href}
                rel="noopener noreferrer"
                style={{ backgroundColor: CANDY[index % CANDY.length] }}
                target="_blank"
              >
                {label}
              </a>
            ))}
          </nav>
        </section>

        {/* now playing sticker */}
        {track ? (
          <section
            className="rise mx-auto mt-16 max-w-sm"
            style={{ animationDelay: "260ms" }}
          >
            <a
              className="flex rotate-[-1deg] items-center gap-4 rounded-2xl border-2 border-[#2b2118] bg-white p-4 shadow-[4px_4px_0_#2b2118] transition-[transform,box-shadow] duration-150 ease-strong hover:rotate-0 hover:[transform:translate(-2px,-2px)] hover:shadow-[6px_6px_0_#2b2118]"
              href={track.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {albumArt ? (
                <img
                  alt={`${track.album} album art`}
                  className={`h-14 w-14 rounded-full border-2 border-[#2b2118] object-cover ${track.isPlaying ? "spin-slow" : ""}`}
                  decoding="async"
                  height={56}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={albumArt}
                  width={56}
                />
              ) : null}
              <div className="min-w-0 flex-1 text-left">
                <p className="font-bold text-[#ff5d8f] text-xs uppercase tracking-wider">
                  {track.isPlaying ? "♫ spinning right now" : "♫ last spin"}
                </p>
                <p className="truncate font-bold">{track.name}</p>
                <p className="truncate text-[#7a6a58] text-sm">
                  {track.artist}
                </p>
              </div>
            </a>
          </section>
        ) : null}

        {/* things i make */}
        <section className="mt-20">
          <h2
            className="rise text-center font-bold text-2xl"
            style={{ animationDelay: "300ms" }}
          >
            things i make{" "}
            <span aria-hidden="true" className="text-[#ff5d8f]">
              ✿
            </span>
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {PROJECTS.map((project, index) => (
              <a
                className="rise group relative rounded-2xl border-2 border-[#2b2118] bg-white p-5 shadow-[4px_4px_0_#2b2118] transition-[transform,box-shadow,rotate] duration-150 ease-strong hover:rotate-0 hover:[transform:translate(-2px,-2px)] hover:shadow-[6px_6px_0_#2b2118]"
                href={project.href}
                key={project.name}
                rel="noopener noreferrer"
                style={{
                  animationDelay: `${340 + index * 60}ms`,
                  rotate: TILTS[index % TILTS.length],
                }}
                target="_blank"
              >
                {/* tape strip */}
                <span
                  aria-hidden="true"
                  className="-top-2.5 -translate-x-1/2 absolute left-1/2 h-5 w-16 rotate-[-2deg] rounded-sm border border-[#2b2118]/10 bg-[#fff3c4]/90"
                />
                <p className="font-bold text-lg">{project.name}</p>
                <p className="mt-1.5 text-[#7a6a58] text-sm leading-relaxed">
                  {project.description}
                </p>
                <p className="mt-3 font-bold text-[#ff5d8f] text-xs uppercase tracking-wider">
                  {project.year} →
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* scribbles */}
        <section className="mt-20">
          <h2 className="rise text-center font-bold text-2xl">
            scribbles{" "}
            <span aria-hidden="true" className="text-[#ff5d8f]">
              ✎
            </span>
          </h2>
          <div className="mx-auto mt-6 max-w-md space-y-3">
            {POSTS.map((post, index) => (
              <a
                className="flex items-baseline justify-between gap-4 rounded-xl border-2 border-transparent px-4 py-2.5 font-medium transition-[border-color,background-color] duration-150 hover:border-[#2b2118] hover:bg-white"
                href={post.href}
                key={post.title}
                rel="noopener noreferrer"
                style={{ rotate: TILTS[(index + 3) % TILTS.length] }}
                target="_blank"
              >
                <span>{post.title}</span>
                <span className="shrink-0 text-[#7a6a58] text-xs">
                  {post.date}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* footer */}
        <footer className="mt-20 pb-8 text-center text-[#7a6a58] text-sm">
          <p>
            made with{" "}
            <span aria-hidden="true" className="text-[#ff5d8f]">
              ♥
            </span>{" "}
            and too much coffee — © {new Date().getFullYear()} {identity.name}
          </p>
          <p className="mt-1 text-xs opacity-60">{NOW.location}</p>
        </footer>
      </div>
    </main>
  );
}
