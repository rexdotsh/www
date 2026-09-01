import type { ReactNode } from "react";
import type { SpotifyTrack } from "@/components/spotify";
import {
  getIdentity,
  getNavLinks,
  POSTS,
  PROJECTS,
  type SiteIdentity,
} from "@/lib/content";

/**
 * the sentence itself — shared by every design on the duet scheme.
 *
 * persona-aware: the subject of the sentence is whoever the domain says
 * it is. hovering the name reveals the other identity; on mridul.sh a
 * quiet aside below the sentence keeps the resume, so the sentence
 * itself never gets crowded.
 */
export function TheSentence({
  className = "",
  hostname,
  track,
}: {
  className?: string;
  hostname: string;
  track: SpotifyTrack | null;
}) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);

  const github =
    links.find((l) => l.label === "github")?.href ??
    "https://github.com/rexdotsh";
  const blog =
    links.find((l) => l.label === "blog")?.href ?? "https://blog.rex.wf";
  const flora =
    links.find((l) => l.label === "flora")?.href ??
    "https://floraorg.github.io";
  const social = "https://x.com/rexmkv";
  const albumArt =
    track?.image.find((image) => image.size === "medium")?.["#text"] ?? "";

  return (
    <>
      <h1 className={className}>
        <Peek
          href={identity.otherDomain}
          peek={<IdentityPeek identity={identity} />}
          tone="name"
        >
          {identity.name}
        </Peek>{" "}
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
      {identity.isMridul ? (
        <p className="mt-6 text-[#847c6c] text-[clamp(1rem,1.7vw,1.3rem)] italic leading-snug">
          ( he also keeps a{" "}
          <Peek href="/resume" peek={<ResumePeek />}>
            resume
          </Peek>{" "}
          — for the professionally curious. )
        </p>
      ) : null}
    </>
  );
}

function Peek({
  children,
  href,
  peek,
  tone = "link",
}: {
  children: ReactNode;
  href: string;
  peek: ReactNode;
  tone?: "link" | "name";
}) {
  const toneClass =
    tone === "name"
      ? "text-[#17140f] decoration-dotted decoration-[#17140f]/30 hover:decoration-[#17140f]/70"
      : "text-[#b3123a] italic decoration-[#b3123a]/30 hover:decoration-[#b3123a]";

  return (
    <a
      className={`peek-trigger relative inline-block underline decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-150 ${toneClass}`}
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

function IdentityPeek({ identity }: { identity: SiteIdentity }) {
  return (
    <PeekCard>
      <span className="block text-[#a29a89] text-[9px] uppercase tracking-[0.25em]">
        {identity.isMridul ? "online, goes by" : "offline, answers to"}
      </span>
      <span className="mt-1 block font-bold text-[#17140f] text-sm">
        {identity.otherName}
      </span>
      <span className="mt-1 block text-[#847c6c] text-[10px]">
        same person, different font of self →{" "}
        {identity.otherDomain.replace("https://", "")}
      </span>
    </PeekCard>
  );
}

function ResumePeek() {
  return (
    <PeekCard>
      <span className="block text-[#a29a89] text-[9px] uppercase tracking-[0.25em]">
        the formal bit
      </span>
      <span className="mt-1 block font-bold text-[#17140f] text-xs">
        resume — one page
      </span>
      <span className="mt-1 block text-[#847c6c] text-[10px]">
        kept current. this is the version that gets sent out.
      </span>
    </PeekCard>
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
