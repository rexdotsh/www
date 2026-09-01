import { useRouter } from "@tanstack/react-router";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { getIdentity, LINKS, POSTS, PROJECTS } from "@/lib/content";
import type { SpotifyTrack } from "@/lib/use-now-playing";

export type SentenceWord =
  | "name"
  | "builds"
  | "writes"
  | "garden"
  | "music"
  | "hi"
  | "resume";

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

  let wordCount = 0;
  const nextDelay = () => {
    wordCount += 1;
    return 150 + (wordCount - 1) * 38;
  };

  const w = (text: string): ReactNode => {
    if (!wordStagger) {
      return text;
    }
    return text.split(/(\s+)/).map((token, index) =>
      /^\s*$/.test(token) ? (
        token
      ) : (
        <span
          className="word-in inline-block"
          key={`${token}-${index}`}
          style={{ animationDelay: `${nextDelay()}ms` }}
        >
          <span className="word-body inline-block">{token}</span>
        </span>
      )
    );
  };

  const wrap = (node: ReactNode): ReactNode =>
    wordStagger ? (
      <span
        className="word-in inline-block"
        style={{ animationDelay: `${nextDelay()}ms` }}
      >
        <span className="word-body inline-block">{node}</span>
      </span>
    ) : (
      node
    );

  const parts: (
    | string
    | {
        href: string;
        key: SentenceWord;
        peek: ReactNode;
        text: string;
        tone?: "name";
      }
  )[] = [
    "hi, i'm ",
    {
      key: "name",
      href: identity.otherDomain,
      text: identity.name,
      tone: "name",
      peek: (
        <TextPeek
          href={identity.otherDomain}
          label="also known as"
          line={`${identity.otherName} → ${identity.otherDomain.replace("https://", "")}`}
        />
      ),
    },
    ". i ",
    {
      key: "builds",
      href: LINKS.github,
      text: "build things",
      peek: <ProjectsPeek />,
    },
    ", i ",
    { key: "writes", href: LINKS.blog, text: "write", peek: <PostsPeek /> },
    " about some of them, share a ",
    {
      key: "garden",
      href: LINKS.flora,
      text: "workshop",
      peek: (
        <TextPeek
          center
          href={LINKS.flora}
          line="flora"
          sub={
            <>
              random things for the web,
              <br />
              two people, several flowers
            </>
          }
        />
      ),
    },
    " with friends, and usually have ",
    {
      key: "music",
      href: track?.url ?? LINKS.blog,
      text: "something",
      peek: track ? <MusicPeek track={track} /> : null,
    },
    " on. ",
  ];

  return (
    <>
      <h1 className={className}>
        {parts.map((part) =>
          typeof part === "string" ? (
            <Fragment key={part}>{w(part)}</Fragment>
          ) : (
            <Fragment key={part.key}>
              {wrap(
                <Peek
                  hoverKey={part.key}
                  href={part.href}
                  onHover={onWordHover}
                  peek={part.peek}
                  tone={part.tone}
                >
                  {part.text}
                </Peek>
              )}
            </Fragment>
          )
        )}
        {wrap(
          <>
            {"say "}
            <Peek
              hoverKey="hi"
              href={LINKS.twitter}
              onHover={onWordHover}
              peek={
                <TextPeek
                  center
                  href={LINKS.twitter}
                  line={`@${identity.handle}`}
                  sub="strangers welcome"
                />
              }
            >
              hi back
            </Peek>
            <span className="text-rose">.</span>
          </>
        )}
      </h1>
      {identity.isMridul ? (
        <p
          className={`mt-6 text-muted text-[clamp(1rem,1.7vw,1.3rem)] italic leading-snug ${wordStagger ? "word-in" : ""}`}
          style={
            wordStagger
              ? { animationDelay: `${nextDelay() + 120}ms` }
              : undefined
          }
        >
          <span className="word-body inline-block">
            ( i also keep a{" "}
            <Peek
              hoverKey="resume"
              href="/resume"
              onHover={onWordHover}
              peek={
                <TextPeek
                  href="/resume"
                  label="on paper"
                  line="open the pdf →"
                />
              }
            >
              resume
            </Peek>{" "}
            — for the professionally curious. )
          </span>
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
  const [armed, setArmed] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const external = href.startsWith("http");

  const report = (word: SentenceWord | null) => {
    if (onHover && hoverKey) {
      onHover(word);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (hoverKey && window.matchMedia("(hover: none)").matches) {
      if (!armed) {
        event.preventDefault();
        setArmed(true);
        report(hoverKey);
        return;
      }
      setArmed(false);
    }
    // internal links ride the router so view transitions apply
    if (!external) {
      event.preventDefault();
      router.navigate({ href });
    }
  };

  useEffect(() => {
    if (!armed) {
      return;
    }
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setArmed(false);
        onHover?.(null);
      }
    };
    document.addEventListener("pointerdown", onDocumentPointerDown);
    return () =>
      document.removeEventListener("pointerdown", onDocumentPointerDown);
  }, [armed, onHover]);

  return (
    <span
      className="peek-trigger relative inline-block"
      data-peek-open={armed ? "" : undefined}
      onPointerEnter={() => report(hoverKey ?? null)}
      onPointerLeave={() => {
        if (!armed) {
          report(null);
        }
      }}
      ref={wrapperRef}
    >
      <a
        className={`underline decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-150 ${
          tone === "name"
            ? "text-ink decoration-dotted decoration-ink/30 hover:decoration-ink/70"
            : "text-rose italic decoration-rose/30 hover:decoration-rose"
        }`}
        href={href}
        onBlur={() => {
          setArmed(false);
          report(null);
        }}
        onClick={handleClick}
        onFocus={() => report(hoverKey ?? null)}
        rel={external ? "noopener noreferrer" : undefined}
        target={external ? "_blank" : undefined}
      >
        {children}
      </a>
      {peek ? <span className="peek">{peek}</span> : null}
      {armed ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: tap-catcher; dismissal also works via focus loss
        // biome-ignore lint/a11y/useKeyWithClickEvents: touch-only affordance
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: touch-only tap-catcher
        <span
          className="fixed inset-0 z-30 md:hidden"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setArmed(false);
            onHover?.(null);
          }}
        />
      ) : null}
    </span>
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
      className={`block rounded-xl border border-ink/10 bg-card text-left font-mono not-italic shadow-[0_16px_40px_-16px_rgba(23,20,15,0.35)] ${
        compact ? "w-fit max-w-60 p-3" : "w-60 p-4"
      }`}
    >
      {children}
    </span>
  );
}

function TextPeek({
  center = false,
  href,
  label,
  line,
  sub,
}: {
  center?: boolean;
  href: string;
  label?: string;
  line: string;
  sub?: ReactNode;
}) {
  const align = center ? " text-center" : "";
  return (
    <PeekCard compact>
      {label ? (
        <span
          className={`block whitespace-nowrap text-faint text-[9px] uppercase tracking-[0.25em]${align}`}
        >
          {label}
        </span>
      ) : null}
      <a
        className={`block whitespace-nowrap text-ink text-xs transition-colors duration-150 hover:text-rose ${label ? "mt-1" : ""}${align}`}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {line}
      </a>
      {sub ? (
        <span
          className={`mt-1 block whitespace-nowrap text-muted text-[10px]${align}`}
        >
          {sub}
        </span>
      ) : null}
    </PeekCard>
  );
}

interface Contributions {
  total: number;
  weeks: number[][];
}

const HEAT_COLORS = [
  "var(--heat-0)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
];

function useContributions() {
  const [data, setData] = useState<Contributions | null>(null);
  useEffect(() => {
    // deferred to idle time; the heatmap is only visible on peek anyway
    const load = () =>
      fetch("/api/github/contributions")
        .then((response) =>
          response.ok
            ? (response.json() as Promise<Contributions | null>)
            : null
        )
        .then(setData)
        .catch(() => setData(null));
    if ("requestIdleCallback" in window) {
      const idle = requestIdleCallback(() => load());
      return () => cancelIdleCallback(idle);
    }
    const timeout = setTimeout(load, 1500);
    return () => clearTimeout(timeout);
  }, []);
  return data;
}

function Heatmap({ total, weeks }: Contributions) {
  return (
    <a
      className="group mt-3 block border-ink/10 border-t pt-3"
      href={LINKS.github}
      rel="noopener noreferrer"
      target="_blank"
    >
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
      <span className="mt-2 block text-center text-faint text-[9px] tracking-[0.1em] transition-colors duration-150 group-hover:text-rose">
        {total.toLocaleString()} contributions, past year
      </span>
    </a>
  );
}

function ProjectsPeek() {
  const graph = useContributions();
  return (
    <PeekCard>
      <span className="block text-faint text-[9px] uppercase tracking-[0.25em]">
        lately
      </span>
      {PROJECTS.map((project) => (
        <a
          className="group mt-2 block"
          href={project.href}
          key={project.name}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="block font-bold text-ink text-xs group-hover:text-rose">
            {project.name}
          </span>
          <span className="block truncate text-muted text-[11px]">
            {project.description}
          </span>
        </a>
      ))}
      {graph && graph.weeks.length > 0 ? <Heatmap {...graph} /> : null}
    </PeekCard>
  );
}

function PostsPeek() {
  const router = useRouter();
  return (
    <PeekCard>
      <span className="block text-faint text-[9px] uppercase tracking-[0.25em]">
        recent writing
      </span>
      {POSTS.map((post) => (
        <a
          className="group mt-2 block"
          href={post.href}
          key={post.title}
          onClick={(event) => {
            if (post.href.startsWith("/")) {
              event.preventDefault();
              router.navigate({ href: post.href });
            }
          }}
        >
          <span className="block truncate text-ink text-xs group-hover:text-rose">
            {post.title}
          </span>
          <span className="block text-muted text-[10px] tabular-nums">
            {post.date}
          </span>
        </a>
      ))}
      <a
        className="mt-3 block border-ink/10 border-t pt-2 text-faint text-[10px] transition-colors duration-150 hover:text-rose"
        href={LINKS.archive}
        rel="noopener noreferrer"
        target="_blank"
      >
        older writeups on github →
      </a>
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

function WaveEq() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-[1em] select-none overflow-hidden font-mono text-rose text-[10px]"
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

function MusicPeek({ track }: { track: SpotifyTrack }) {
  const { isPlaying } = track;
  const albumArt =
    track.image.find((image) => image.size === "medium")?.["#text"] ?? "";
  return (
    <PeekCard compact={!isPlaying}>
      <a
        className={`group flex items-center ${isPlaying ? "gap-3" : "gap-2.5"}`}
        href={track.url}
        rel="noopener noreferrer"
        target="_blank"
      >
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
        <span className={`min-w-0 ${isPlaying ? "flex-1" : ""}`}>
          <span className="block whitespace-nowrap text-faint text-[9px] uppercase tracking-[0.2em]">
            {isPlaying ? "right now" : "last played"}
          </span>
          <span className="block truncate font-bold text-ink text-xs group-hover:text-rose">
            {track.name}
          </span>
          <span className="block truncate text-muted text-[11px]">
            {track.artist}
          </span>
        </span>
        {isPlaying ? <WaveEq /> : null}
      </a>
    </PeekCard>
  );
}
