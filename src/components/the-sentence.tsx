import { useRouter } from "@tanstack/react-router";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { getIdentity, LINKS, PROJECTS } from "@/lib/content";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { SCALE, sfx } from "@/lib/sfx";
import type { SpotifyTrack } from "@/lib/use-now-playing";

export type SentenceWord =
  | "name"
  | "builds"
  | "writes"
  | "garden"
  | "music"
  | "hi"
  | "resume";

const NOTES: Record<SentenceWord, number> = {
  name: SCALE[0],
  builds: SCALE[1],
  writes: SCALE[2],
  garden: SCALE[3],
  music: SCALE[4],
  hi: SCALE[5],
  resume: SCALE[5],
};

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
        text: ReactNode;
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
          label="the workshop"
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
      text: (
        <>
          somethin<span className="inline-block">g</span>
        </>
      ),
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
                  label="over on x"
                  line={`@${identity.handle}`}
                  sub="strangers welcome"
                />
              }
            >
              hi back
            </Peek>
            <FullStop />
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

function FullStop() {
  const ref = useRef<HTMLSpanElement>(null);
  const [fallen, setFallen] = useState(false);

  const knock = () => {
    const stop = ref.current;
    if (fallen || !stop) {
      return;
    }
    const rect = stop.getBoundingClientRect();
    const floor = window.innerHeight - 24;
    stop.style.setProperty("--drop", `${floor - rect.bottom}px`);
    setFallen(true);
    setTimeout(() => sfx("tick", 392), 620);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the period is content first, a toy second
    // biome-ignore lint/a11y/useKeyWithClickEvents: pointer-only whimsy
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: pointer-only whimsy
    <span
      className={`full-stop text-rose${fallen ? " full-stop-fallen" : ""}`}
      onClick={knock}
      ref={ref}
    >
      .
    </span>
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
  hoverKey: SentenceWord;
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
    onHover?.(word);
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(hover: none)").matches) {
      if (!armed) {
        event.preventDefault();
        setArmed(true);
        report(hoverKey);
        if (peek) {
          sfx("tick", NOTES[hoverKey]);
        }
        return;
      }
      setArmed(false);
    }
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
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") {
          return;
        }
        report(hoverKey);
        if (!external) {
          router
            .preloadRoute({ href } as Parameters<typeof router.preloadRoute>[0])
            .catch(() => undefined);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch" && !armed) {
          report(null);
        }
      }}
      ref={wrapperRef}
    >
      <a
        className={`sentence-link ${
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
        onFocus={() => report(hoverKey)}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            sfx("pop");
          }
        }}
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
  center = false,
  children,
  compact = false,
  fit = false,
  label,
}: {
  center?: boolean;
  children: ReactNode;
  compact?: boolean;
  fit?: boolean;
  label?: string;
}) {
  const size = compact
    ? "w-fit max-w-64 px-3.5 pt-4 pb-3"
    : fit
      ? "w-fit max-w-64 px-4 pt-4 pb-4"
      : "w-60 px-4 pt-4 pb-4";
  return (
    <span
      className={`peek-card block rounded-xl border border-ink/10 bg-card text-left font-mono not-italic ${size}`}
    >
      {label ? (
        <span className={`peek-tab${center ? " peek-tab-center" : ""}`}>
          {label}
        </span>
      ) : null}
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
    <PeekCard center={center} compact label={label}>
      <a
        className={`peek-name block whitespace-nowrap${align}`}
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
    <PeekCard label="lately">
      {PROJECTS.map((project, index) => (
        <a
          className={`group block ${index > 0 ? "mt-2.5" : ""}`}
          href={project.href}
          key={project.name}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="peek-name block">{project.name}</span>
          <span className="block truncate text-muted text-[10.5px]">
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
    <PeekCard fit label="recent writing">
      {PUBLISHED_META.map((post, index) => {
        const href = `/blog/${post.slug}`;
        return (
          <a
            className={`group block ${index > 0 ? "mt-2.5" : ""}`}
            href={href}
            key={post.slug}
            onClick={(event) => {
              event.preventDefault();
              router.navigate({ href });
            }}
          >
            <span className="peek-name block truncate">{post.title}</span>
            <span className="block text-muted text-[10px] tabular-nums">
              {post.date.slice(0, 7)}
            </span>
          </a>
        );
      })}
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
    <PeekCard
      compact={!isPlaying}
      label={isPlaying ? "right now" : "last played"}
    >
      <a
        className={`group flex items-center ${isPlaying ? "gap-3" : "gap-2.5"}`}
        href={track.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {albumArt ? (
          <img
            alt=""
            className={`rounded-md object-cover ${isPlaying ? "h-12 w-12" : "h-10 w-10"}`}
            height={isPlaying ? 48 : 40}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={albumArt}
            width={isPlaying ? 48 : 40}
          />
        ) : null}
        <span className={`min-w-0 ${isPlaying ? "flex-1" : ""}`}>
          <span className="peek-name block truncate">{track.name}</span>
          <span className="block truncate text-muted text-[10.5px]">
            {track.artist}
          </span>
        </span>
        {isPlaying ? <WaveEq /> : null}
      </a>
    </PeekCard>
  );
}
