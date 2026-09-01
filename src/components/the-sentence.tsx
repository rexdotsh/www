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

function PeekCard({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={`block rounded-xl border border-[#17140f]/10 bg-white text-left font-mono not-italic shadow-[0_16px_40px_-16px_rgba(23,20,15,0.35)] ${
        compact ? "w-fit max-w-60 p-3" : "w-60 p-4"
      }`}
    >
      {children}
    </span>
  );
}

function IdentityPeek({ identity }: { identity: SiteIdentity }) {
  return (
    <PeekCard compact>
      <span className="block whitespace-nowrap text-[#a29a89] text-[9px] uppercase tracking-[0.25em]">
        {identity.isMridul ? "internet name" : "government name"}
      </span>
      <span className="mt-1 block font-bold text-[#17140f] text-sm">
        {identity.otherName}
      </span>
      <span className="mt-1 block whitespace-nowrap text-[#847c6c] text-[10px]">
        → {identity.otherDomain.replace("https://", "")}
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

interface Contributions {
  total: number;
  weeks: number[][];
}

/** github's green ramp, re-dyed in the rose's reds. -1 = padding day */
const HEAT_COLORS = ["#efe9dc", "#f0c3cd", "#e5798f", "#ce2955", "#8f1236"];

function useContributions() {
  const [data, setData] = useState<Contributions | null>(null);
  useEffect(() => {
    fetch("/api/github/contributions")
      .then((response) =>
        response.ok ? (response.json() as Promise<Contributions | null>) : null
      )
      .then(setData)
      .catch(() => setData(null));
  }, []);
  return data;
}

function Heatmap({ total, weeks }: Contributions) {
  return (
    <span className="mt-3 block border-[#17140f]/10 border-t pt-3">
      <span className="flex justify-center gap-px">
        {weeks.slice(-52).map((week, weekIndex) => (
          <span className="flex flex-col gap-px" key={`w${weekIndex}`}>
            {week.map((level, dayIndex) => (
              <span
                className="h-[3px] w-[3px] rounded-[1px]"
                key={`d${dayIndex}`}
                style={{
                  backgroundColor:
                    level < 0 ? "transparent" : HEAT_COLORS[level],
                }}
              />
            ))}
          </span>
        ))}
      </span>
      <span className="mt-2 block text-center text-[#a29a89] text-[9px] tracking-[0.1em]">
        {total.toLocaleString()} contributions, past year
      </span>
    </span>
  );
}

function ProjectsPeek() {
  const graph = useContributions();
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
      {graph && graph.weeks.length > 0 ? <Heatmap {...graph} /> : null}
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
    <PeekCard compact>
      <span className="block whitespace-nowrap text-center text-[#17140f] text-xs">
        flora
      </span>
      <span className="mt-1 block whitespace-nowrap text-center text-[#847c6c] text-[10px]">
        random things for the web,
        <br />
        grown with friends
      </span>
    </PeekCard>
  );
}

const WAVE_CELLS = [
  "wave-p1",
  "wave-p3",
  "wave-p5",
  "wave-p5",
  "wave-p3",
  "wave-p1",
];

/** compact symmetric dot-matrix wave — the row's "this is playing" meter */
function WaveEq() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-[1em] select-none overflow-hidden font-mono text-[#b3123a] text-[10px]"
    >
      {WAVE_CELLS.map((cell, index) => (
        <span
          className="relative flex h-full w-[1ch] items-center justify-center"
          key={`${cell}-${index}`}
        >
          <span className="opacity-30">░</span>
          <span
            className={`absolute inset-0 flex items-center justify-center ${cell}`}
          >
            █
          </span>
        </span>
      ))}
    </span>
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
    <PeekCard compact={!isPlaying}>
      <span className={`flex items-center ${isPlaying ? "gap-3" : "gap-2.5"}`}>
        {albumArt ? (
          <img
            alt=""
            className={`rounded-md object-cover ${isPlaying ? "h-12 w-12" : "h-9 w-9"}`}
            height={isPlaying ? 48 : 36}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={albumArt}
            width={isPlaying ? 48 : 36}
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block whitespace-nowrap text-[#a29a89] text-[9px] uppercase tracking-[0.2em]">
            {isPlaying ? "right now" : "last played"}
          </span>
          <span className="block truncate font-bold text-[#17140f] text-xs">
            {name}
          </span>
          <span className="block truncate text-[#847c6c] text-[11px]">
            {artist}
          </span>
        </span>
        {isPlaying ? <WaveEq /> : null}
      </span>
    </PeekCard>
  );
}

function HiPeek({ handle }: { handle: string }) {
  return (
    <PeekCard compact>
      <span className="block whitespace-nowrap text-center text-[#17140f] text-xs">
        @{handle}
      </span>
      <span className="mt-1 block whitespace-nowrap text-center text-[#847c6c] text-[10px]">
        dms open, probably
      </span>
    </PeekCard>
  );
}
