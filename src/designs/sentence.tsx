import type { ReactNode } from "react";
import { getIdentity, getNavLinks, POSTS, PROJECTS } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

/**
 * design 8 — "one sentence"
 * the entire site is a single giant sentence. the important words are
 * links; hovering them peeks the thing they point at.
 */
export default function SentenceDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();

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
      <span className="absolute top-5 left-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[#a29a89]">
        {identity.name}.wf
      </span>

      <div className="flex min-h-full items-center px-6 py-24 md:px-14">
        <h1 className="rise max-w-5xl text-[clamp(2.1rem,6.2vw,4.6rem)] leading-[1.18] tracking-[-0.01em]">
          {identity.name}{" "}
          <Peek href={github} peek={<ProjectsPeek />}>
            builds things
          </Peek>{" "}
          on the internet,{" "}
          <Peek href={blog} peek={<PostsPeek />}>
            writes
          </Peek>{" "}
          sometimes, grows a{" "}
          <Peek href={flora} peek={<RosePeek />}>
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
      </div>

      {/* footnote */}
      <p className="absolute bottom-5 left-6 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a29a89]">
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
      className="peek-trigger relative inline-block italic text-[#b3123a] underline decoration-[#b3123a]/30 decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-150 hover:decoration-[#b3123a]"
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
      <span className="block text-[9px] uppercase tracking-[0.25em] text-[#a29a89]">
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
      <span className="block text-[9px] uppercase tracking-[0.25em] text-[#a29a89]">
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

function RosePeek() {
  return (
    <PeekCard>
      <img
        alt=""
        className="mx-auto w-24 select-none"
        height="320"
        loading="lazy"
        src="/rose.avif"
        width="320"
      />
      <span className="mt-1 block text-center text-[#847c6c] text-[10px]">
        the rose approves
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
          <span className="block text-[9px] uppercase tracking-[0.2em] text-[#a29a89]">
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
