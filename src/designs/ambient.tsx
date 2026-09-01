import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useAudioPlayer } from "react-use-audio-player";
import { getIdentity, getNavLinks, NOW, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 4 — "ambient"
 * a dark room with the lights down. gradient bloom, film grain, glass
 * surfaces, and everything settling into place with springs.
 */
export default function AmbientDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track, previewUrl } = useNowPlaying();

  // decorative parallax on the light field, spring-smoothed
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const springX = useSpring(glowX, { stiffness: 40, damping: 20 });
  const springY = useSpring(glowY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      glowX.set(((event.clientX / innerWidth) * 2 - 1) * 24);
      glowY.set(((event.clientY / innerHeight) * 2 - 1) * 24);
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [glowX, glowY]);

  return (
    <main className="grain relative min-h-dvh overflow-hidden bg-[#08060c] font-soft text-[#e8e4ef] selection:bg-[#ff2e63]/70 selection:text-white">
      {/* light field */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ x: springX, y: springY }}
      >
        <div className="drift-a absolute top-[-15%] left-[8%] h-[55vmax] w-[55vmax] rounded-full bg-[#ff2e63] opacity-[0.13] blur-[120px]" />
        <div className="drift-b absolute right-[-10%] bottom-[-20%] h-[50vmax] w-[50vmax] rounded-full bg-[#6d28d9] opacity-[0.14] blur-[120px]" />
        <div className="absolute top-[35%] right-[25%] h-[30vmax] w-[30vmax] rounded-full bg-[#0e7490] opacity-[0.1] blur-[110px]" />
      </motion.div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col px-6">
        {/* hero */}
        <section className="flex min-h-dvh flex-col items-center justify-center text-center">
          <div className="rise breathe" style={{ animationDelay: "80ms" }}>
            <img
              alt="A pink ASCII rose, glowing softly"
              className="w-44 select-none [filter:drop-shadow(0_0_36px_rgba(255,46,99,0.45))] md:w-56"
              fetchPriority="high"
              height="320"
              src="/rose.avif"
              width="320"
            />
          </div>
          <h1
            className="rise mt-10 font-light text-3xl tracking-[0.35em] uppercase md:text-4xl"
            style={{ animationDelay: "180ms" }}
          >
            {identity.name}
          </h1>
          <p
            className="rise mt-3 text-[#9d93ad] text-sm tracking-[0.2em]"
            style={{ animationDelay: "260ms" }}
          >
            {identity.tagline}
          </p>

          <nav
            aria-label="primary"
            className="rise mt-12 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "340ms" }}
          >
            {links.map(({ href, label }) => (
              <a
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm tracking-wider backdrop-blur-md transition-[background-color,border-color,transform] duration-200 ease-strong hover:border-white/25 hover:bg-white/[0.09] hover:[transform:translateY(-2px)] active:[transform:scale(0.97)]"
                href={href}
                key={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {label}
              </a>
            ))}
          </nav>

          {track ? (
            <div
              className="rise mt-16 w-full"
              style={{ animationDelay: "420ms" }}
            >
              <GlassPlayer previewUrl={previewUrl} track={track} />
            </div>
          ) : null}
        </section>

        {/* work */}
        <section className="pb-8">
          <SectionLabel>selected work</SectionLabel>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {PROJECTS.map((project) => (
              <a
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-[background-color,border-color,transform] duration-200 ease-strong hover:border-white/20 hover:bg-white/[0.08] hover:[transform:translateY(-3px)]"
                href={project.href}
                key={project.name}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium tracking-wide">
                    {project.name}
                  </span>
                  <span className="text-[#9d93ad] text-xs tabular-nums">
                    {project.year}
                  </span>
                </div>
                <p className="mt-2 text-[#9d93ad] text-sm leading-relaxed">
                  {project.description}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* writing */}
        <section className="pt-10 pb-8">
          <SectionLabel>writing</SectionLabel>
          <div className="mt-6 space-y-2">
            {POSTS.map((post) => (
              <a
                className="group flex items-baseline justify-between gap-4 rounded-xl border border-transparent px-4 py-3 transition-[background-color,border-color] duration-200 hover:border-white/10 hover:bg-white/[0.05]"
                href={post.href}
                key={post.title}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="tracking-wide transition-colors duration-200 group-hover:text-[#ff8fa5]">
                  {post.title}
                </span>
                <span className="shrink-0 text-[#9d93ad] text-xs tabular-nums">
                  {post.date}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* footer */}
        <footer className="flex items-center justify-between py-10 text-[#9d93ad] text-xs tracking-[0.2em] uppercase">
          <span>© {new Date().getFullYear()}</span>
          <span>{NOW.location}</span>
        </footer>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[#9d93ad] text-xs tracking-[0.35em] uppercase">
        {children}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
    </div>
  );
}

function GlassPlayer({
  previewUrl,
  track,
}: {
  previewUrl: string | null;
  track: NonNullable<ReturnType<typeof useNowPlaying>["track"]>;
}) {
  const { load, isPlaying, play, pause, fade } = useAudioPlayer();
  const albumArt =
    track.image.find((image) => image.size === "medium")?.["#text"] ?? "";

  useEffect(() => {
    if (previewUrl) {
      load(previewUrl, { html5: true });
    }
  }, [load, previewUrl]);

  const togglePreview = () => {
    if (!previewUrl) {
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      play();
      fade(0, 0.2, 500);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur-xl">
      <a
        className="shrink-0"
        href={track.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          alt={`${track.album} album art`}
          className="h-14 w-14 rounded-lg object-cover"
          decoding="async"
          height={56}
          loading="lazy"
          referrerPolicy="no-referrer"
          src={albumArt}
          width={56}
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="text-[#9d93ad] text-[11px] tracking-[0.2em] uppercase">
          {track.isPlaying ? "now playing" : "last played"}
        </p>
        <p className="truncate text-sm">{track.name}</p>
        <p className="truncate text-[#9d93ad] text-xs">{track.artist}</p>
      </div>
      <button
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
        className="shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/[0.06] p-2.5 transition-[background-color,transform] duration-150 hover:bg-white/[0.12] active:[transform:scale(0.94)] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!previewUrl}
        onClick={togglePreview}
        type="button"
      >
        {isPlaying ? (
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
