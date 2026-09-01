import { useEffect, useRef, useState } from "react";
import { createSuperHover } from "super-hover";
import { ASCII_ROSE } from "@/lib/ascii-rose";
import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 1 — "terminal"
 * a quiet system session. everything renders like output from a shell.
 */
export default function TerminalDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) {
      return;
    }
    const superHover = createSuperHover({ root });
    return () => superHover.destroy();
  }, []);

  let delay = 0;
  const stagger = (step = 70) => {
    delay += step;
    return { animationDelay: `${delay}ms` };
  };

  return (
    <main className="scanlines min-h-dvh bg-[#050505] px-5 py-10 font-mono text-[#c9c9c2] text-sm leading-relaxed selection:bg-[#ff3b5c] selection:text-black md:px-0 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        {/* session header */}
        <p className="rise text-[#5c5c56]" style={stagger(0)}>
          last login: {new Date().getFullYear()} — tty1
        </p>

        <div className="rise mt-6" style={stagger()}>
          <Prompt prompt={NOW.prompt} /> whoami
        </div>
        <h1
          className="rise mt-2 font-bold text-[#f2f2ec] text-base"
          style={stagger()}
        >
          {identity.name}{" "}
          <span className="font-normal text-[#5c5c56]">
            — {identity.tagline}
          </span>
        </h1>

        {/* the rose */}
        <div className="rise mt-8" style={stagger()}>
          <Prompt prompt={NOW.prompt} /> cat ./rose
        </div>
        <pre
          aria-label="ascii rose"
          className="rise mt-3 select-none overflow-x-auto text-[9px] leading-[1.15] md:text-[11px]"
          role="img"
          style={{
            ...stagger(),
            color: "transparent",
            backgroundImage:
              "linear-gradient(160deg, #ff8fa5 0%, #ff3b5c 45%, #b3123a 100%)",
            backgroundClip: "text",
          }}
        >
          {ASCII_ROSE}
        </pre>

        {/* links */}
        <div className="rise mt-10" style={stagger()}>
          <Prompt prompt={NOW.prompt} /> ls ./links
        </div>
        <ul className="rise mt-3" ref={listRef} style={stagger()}>
          {links.map(({ href, label }) => (
            <li data-super-hover key={href}>
              <a
                className="flex gap-6 px-2 py-1 transition-colors duration-100 data-[super-hover-active]:bg-[#ff3b5c] data-[super-hover-active]:text-black"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="text-[#5c5c56]">drwxr-xr-x</span>
                <span className="font-bold">{label}/</span>
              </a>
            </li>
          ))}
        </ul>

        {/* projects */}
        <div className="rise mt-10" style={stagger()}>
          <Prompt prompt={NOW.prompt} /> cat ./projects.tsv
        </div>
        <div className="rise mt-3 space-y-1" style={stagger()}>
          {PROJECTS.map((project) => (
            <a
              className="group flex items-baseline gap-4 px-2 py-1 transition-colors duration-100 hover:bg-[#141414]"
              href={project.href}
              key={project.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="w-32 shrink-0 font-bold text-[#f2f2ec] transition-colors duration-100 group-hover:text-[#ff3b5c]">
                {project.name}
              </span>
              <span className="hidden w-24 shrink-0 text-[#5c5c56] md:block">
                {project.language}
              </span>
              <span className="min-w-0 flex-1 truncate text-[#8a8a82]">
                {project.description}
              </span>
            </a>
          ))}
        </div>

        {/* writing */}
        <div className="rise mt-10" style={stagger()}>
          <Prompt prompt={NOW.prompt} /> tail ./blog.log
        </div>
        <div className="rise mt-3 space-y-1" style={stagger()}>
          {POSTS.map((post) => (
            <a
              className="group flex items-baseline gap-4 px-2 py-1 transition-colors duration-100 hover:bg-[#141414]"
              href={post.href}
              key={post.title}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="shrink-0 text-[#5c5c56]">{post.date}</span>
              <span className="text-[#c9c9c2] transition-colors duration-100 group-hover:text-[#ff3b5c]">
                {post.title}
              </span>
            </a>
          ))}
        </div>

        {/* idle prompt */}
        <div className="rise mt-10" style={stagger()}>
          <Prompt prompt={NOW.prompt} />{" "}
          <span className="cursor-blink inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] bg-[#c9c9c2]" />
        </div>
      </div>

      {/* statusline */}
      <footer className="fixed inset-x-0 bottom-0 hidden border-[#1c1c1c] border-t bg-[#0a0a0a]/90 px-4 py-1.5 pr-52 text-[#5c5c56] text-xs backdrop-blur-sm md:block xl:pr-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <span className="text-[#ff3b5c]">{NOW.prompt}</span>
          <span className="min-w-0 truncate">
            {track ? `♫ ${track.artist} — ${track.name}` : `♫ ${NOW.doing}`}
          </span>
          <Clock />
        </div>
      </footer>
    </main>
  );
}

function Prompt({ prompt }: { prompt: string }) {
  return <span className="select-none text-[#ff3b5c]">{prompt}</span>;
}

function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="shrink-0 tabular-nums">{time ?? "--:--:--"}</span>;
}
