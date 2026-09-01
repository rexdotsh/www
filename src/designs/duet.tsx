import { type ReactNode, useState } from "react";
import ParticleRose from "@/designs/particle-rose";
import { getIdentity, getNavLinks, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 3 — "duet"
 * bloom + one sentence, sharing the stage: the giant sentence carries
 * the words, the particle rose carries the play. two instruments, one
 * quiet room.
 */
export default function DuetDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const [touched, setTouched] = useState(false);

  const github =
    links.find((l) => l.label === "github")?.href ??
    "https://github.com/rexdotsh";
  const blog =
    links.find((l) => l.label === "blog")?.href ?? "https://blog.rex.wf";
  const social =
    links.find((l) => l.label === "twitter" || l.label === "resume")?.href ??
    "https://x.com/rexmkv";
  const flora =
    links.find((l) => l.label === "flora")?.href ??
    "https://floraorg.github.io";
  const albumArt =
    track?.image.find((image) => image.size === "medium")?.["#text"] ?? "";

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#faf8f2] font-serif-display text-[#17140f] selection:bg-[#b3123a] selection:text-[#faf8f2]">
      {/* wordmark */}
      <span className="absolute top-5 left-6 font-mono text-[#a29a89] text-[10px] uppercase tracking-[0.3em]">
        {identity.name}.wf
      </span>

      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center gap-10 px-6 py-24 md:flex-row md:gap-14 md:px-12">
        {/* the sentence */}
        <h1 className="rise order-2 max-w-2xl flex-1 text-[clamp(1.9rem,4.4vw,3.5rem)] leading-[1.2] tracking-[-0.01em] md:order-1">
          {identity.name}{" "}
          <Peek href={github} peek={<ProjectsPeek />}>
            builds things
          </Peek>{" "}
          on the internet,{" "}
          <Peek href={blog} peek={<PostsPeek />}>
            writes
          </Peek>{" "}
          sometimes, grows a{" "}
          <Peek href={flora} peek={<FloraPeek />}>
            garden
          </Peek>{" "}
          with friends, listens to{" "}
          <Peek
            href={track?.url ?? blog}
            peek={
              track ? (
                <MusicPeek
                  albumArt={albumArt}
                  artist={track.artist}
                  isPlaying={track.isPlaying}
                  name={track.name}
                />
              ) : null
            }
          >
            music
          </Peek>{" "}
          constantly, and thinks you should{" "}
          <Peek href={social} peek={<HiPeek handle={identity.handle} />}>
            say hi
          </Peek>
          <span className="text-[#b3123a]">.</span>
        </h1>

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

      {/* footnote */}
      <p className="absolute bottom-5 left-6 font-mono text-[#a29a89] text-[10px] uppercase tracking-[0.25em]">
        © {new Date().getFullYear()} — that's the whole site
      </p>
    </main>
  );
}

function Peek({
  children,
  href,
  peek,
}: {
  children: ReactNode;
  href: string;
  peek: ReactNode;
}) {
  return (
    <a
      className="peek-trigger relative inline-block text-[#b3123a] italic underline decoration-[#b3123a]/30 decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-150 hover:decoration-[#b3123a]"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      {peek ? (
        <span aria-hidden="true" className="peek">
          {peek}
        </span>
      ) : null}
    </a>
  );
}

function PeekCard({ children }: { children: ReactNode }) {
  return (
    <span className="block w-60 rounded-xl border border-[#17140f]/10 bg-white p-4 text-left font-mono not-italic shadow-[0_16px_40px_-16px_rgba(23,20,15,0.35)]">
      {children}
    </span>
  );
}

function ProjectsPeek() {
  return (
    <PeekCard>
      <span className="block text-[#a29a89] text-[9px] uppercase tracking-[0.25em]">
        lately
      </span>
      {PROJECTS.slice(0, 3).map((project) => (
        <span className="mt-2 block" key={project.name}>
          <span className="block font-bold text-[#17140f] text-xs">
            {project.name}
          </span>
          <span className="block truncate text-[#847c6c] text-[11px]">
            {project.description}
          </span>
        </span>
      ))}
    </PeekCard>
  );
}

function PostsPeek() {
  return (
    <PeekCard>
      <span className="block text-[#a29a89] text-[9px] uppercase tracking-[0.25em]">
        recent writing
      </span>
      {POSTS.slice(0, 3).map((post) => (
        <span className="mt-2 block" key={post.title}>
          <span className="block truncate text-[#17140f] text-xs">
            {post.title}
          </span>
          <span className="block text-[#847c6c] text-[10px] tabular-nums">
            {post.date}
          </span>
        </span>
      ))}
    </PeekCard>
  );
}

function FloraPeek() {
  return (
    <PeekCard>
      <span className="block text-center text-[#17140f] text-xs">flora</span>
      <span className="mt-1 block text-center text-[#847c6c] text-[10px]">
        an open canvas for images, built with friends
      </span>
    </PeekCard>
  );
}

function MusicPeek({
  albumArt,
  artist,
  isPlaying,
  name,
}: {
  albumArt: string;
  artist: string;
  isPlaying: boolean;
  name: string;
}) {
  return (
    <PeekCard>
      <span className="flex items-center gap-3">
        {albumArt ? (
          <img
            alt=""
            className="h-12 w-12 rounded-md object-cover"
            height={48}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={albumArt}
            width={48}
          />
        ) : null}
        <span className="min-w-0">
          <span className="block text-[#a29a89] text-[9px] uppercase tracking-[0.2em]">
            {isPlaying ? "right now" : "last played"}
          </span>
          <span className="block truncate font-bold text-[#17140f] text-xs">
            {name}
          </span>
          <span className="block truncate text-[#847c6c] text-[11px]">
            {artist}
          </span>
        </span>
      </span>
    </PeekCard>
  );
}

function HiPeek({ handle }: { handle: string }) {
  return (
    <PeekCard>
      <span className="block text-center text-[#17140f] text-xs">
        @{handle}
      </span>
      <span className="mt-1 block text-center text-[#847c6c] text-[10px]">
        dms open, probably
      </span>
    </PeekCard>
  );
}
