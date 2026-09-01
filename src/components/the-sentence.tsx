import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  getIdentity,
  getNavLinks,
  POSTS,
  PROJECTS,
  type SiteIdentity,
} from "@/lib/content";
import type { SpotifyTrack } from "@/lib/use-now-playing";

/** the words that can conduct something (see encore's rose modes) */
export type SentenceWord =
  | "name"
  | "builds"
  | "writes"
  | "garden"
  | "music"
  | "hi"
  | "resume";

/**
 * the sentence itself — shared by every design on the duet scheme.
 *
 * persona-aware: the subject of the sentence is whoever the domain says
 * it is. hovering the name reveals the other identity; on mridul.sh a
 * quiet aside below the sentence keeps the resume, so the sentence
 * itself never gets crowded.
 *
 * `wordStagger` typesets the sentence word by word on load;
 * `onWordHover` reports which linked word the pointer is on, so a
 * design can react (encore conducts the rose with it).
 */
export function TheSentence({
  className = "",
  hostname,
  onWordHover,
  track,
  wordStagger = false,
}: {
  className?: string;
  hostname: string;
  onWordHover?: (word: SentenceWord | null) => void;
  track: SpotifyTrack | null;
  wordStagger?: boolean;
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

  // word-by-word typesetting: delays accumulate in reading order
  let wordCount = 0;
  const nextDelay = () => {
    const delay = 150 + wordCount * 38;
    wordCount += 1;
    return delay;
  };

  const w = (text: string): ReactNode => {
    if (!wordStagger) {
      return text;
    }
    return text.split(/(\s+)/).map((token, index) =>
      token === "" || /^\s+$/.test(token) ? (
        token
      ) : (
        <span
          className="word-in inline-block"
          key={`${token}-${index}-${wordCount}`}
          style={{ animationDelay: `${nextDelay()}ms` }}
        >
          {token}
        </span>
      )
    );
  };

  const wrap = (node: ReactNode): ReactNode => {
    if (!wordStagger) {
      return node;
    }
    return (
      <span
        className="word-in inline-block"
        style={{ animationDelay: `${nextDelay()}ms` }}
      >
        {node}
      </span>
    );
  };

  return (
    <>
      <h1 className={className}>
        {wrap(
          <Peek
            hoverKey="name"
            href={identity.otherDomain}
            onHover={onWordHover}
            peek={<IdentityPeek identity={identity} />}
            tone="name"
          >
            {identity.name}
          </Peek>
        )}{" "}
        {wrap(
          <Peek
            hoverKey="builds"
            href={github}
            onHover={onWordHover}
            peek={<ProjectsPeek />}
          >
            builds things
          </Peek>
        )}
        {w(" on the internet, ")}
        {wrap(
          <Peek
            hoverKey="writes"
            href={blog}
            onHover={onWordHover}
            peek={<PostsPeek />}
          >
            writes
          </Peek>
        )}
        {w(" sometimes, grows a ")}
        {wrap(
          <Peek
            hoverKey="garden"
            href={flora}
            onHover={onWordHover}
            peek={<FloraPeek />}
          >
            garden
          </Peek>
        )}
        {w(" with friends, listens to ")}
        {wrap(
          <Peek
            hoverKey="music"
            href={track?.url ?? blog}
            onHover={onWordHover}
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
          </Peek>
        )}
        {w(" constantly, and thinks you should ")}
        {wrap(
          <Peek
            hoverKey="hi"
            href={social}
            onHover={onWordHover}
            peek={<HiPeek handle={identity.handle} />}
          >
            say hi
          </Peek>
        )}
        {wrap(<span className="text-[#b3123a]">.</span>)}
      </h1>
      {identity.isMridul ? (
        <p
          className={`mt-6 text-[#847c6c] text-[clamp(1rem,1.7vw,1.3rem)] italic leading-snug ${wordStagger ? "word-in" : ""}`}
          style={
            wordStagger
              ? { animationDelay: `${nextDelay() + 120}ms` }
              : undefined
          }
        >
          ( he also keeps a{" "}
          <Peek
            hoverKey="resume"
            href="/resume"
            onHover={onWordHover}
            peek={<ResumePeek />}
          >
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
  hoverKey,
  href,
  onHover,
  peek,
  tone = "link",
}: {
  children: ReactNode;
  hoverKey?: SentenceWord;
  href: string;
  onHover?: (word: SentenceWord | null) => void;
  peek: ReactNode;
  tone?: "link" | "name";
}) {
  // touch devices: first tap arms the word (conducts the rose, shows
  // the peek), second tap navigates. tapping elsewhere disarms.
  const [armed, setArmed] = useState(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  const toneClass =
    tone === "name"
      ? "text-[#17140f] decoration-dotted decoration-[#17140f]/30 hover:decoration-[#17140f]/70"
      : "text-[#b3123a] italic decoration-[#b3123a]/30 hover:decoration-[#b3123a]";

  const report = (word: SentenceWord | null) => {
    if (onHover && hoverKey) {
      onHover(word);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hoverKey) {
      return;
    }
    if (!window.matchMedia("(hover: none)").matches) {
      return;
    }
    if (armed) {
      // second tap — navigate, and stand down
      setArmed(false);
      return;
    }
    event.preventDefault();
    setArmed(true);
    report(hoverKey);
  };

  useEffect(() => {
    if (!armed) {
      return;
    }
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (anchorRef.current?.contains(event.target as Node)) {
        return;
      }
      setArmed(false);
      if (onHover && hoverKey) {
        onHover(null);
      }
    };
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () =>
      document.removeEventListener("pointerdown", onDocumentPointerDown);
  }, [armed, onHover, hoverKey]);

  return (
    <a
      className={`peek-trigger relative inline-block underline decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-150 ${toneClass}`}
      data-peek-open={armed ? "" : undefined}
      href={href}
      onBlur={() => {
        setArmed(false);
        report(null);
      }}
      onClick={handleClick}
      onFocus={() => report(hoverKey ?? null)}
      onPointerEnter={() => report(hoverKey ?? null)}
      onPointerLeave={() => {
        if (!armed) {
          report(null);
        }
      }}
      ref={anchorRef}
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
