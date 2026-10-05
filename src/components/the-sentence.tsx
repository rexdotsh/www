import { Link } from "@tanstack/react-router";
import {
  Fragment,
  memo,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Lamp, Sparkline } from "@/components/fleet";
import Icon from "@/components/icon";
import { EMAIL, getIdentity, LINKS, PROJECTS } from "@/lib/content";
import { type Fleet, mockFleet } from "@/lib/fleet";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { SCALE, sfx } from "@/lib/sfx";
import type { NowPlaying } from "@/lib/spotify";
import { compact } from "@/lib/stats";
import { useCopied } from "@/lib/use-copied";
import { beacon, useSiteStats } from "@/lib/use-stats";
import { getJson, isTouch, whenIdle } from "@/lib/utils";

export type SentenceWord =
  | "name"
  | "builds"
  | "writes"
  | "workshop"
  | "music"
  | "hi"
  | "resume";

const PUNCTUATION = /^[,.;:!?]+/;

const NOTES: Record<SentenceWord, number> = {
  name: SCALE[0],
  builds: SCALE[1],
  writes: SCALE[2],
  workshop: SCALE[3],
  music: SCALE[4],
  hi: SCALE[5],
  resume: SCALE[5],
};

// Without hover, or as bottom sheets below md, cards open on the first tap or click.
const SHEETS = "(hover: none), (max-width: 767px)";
const OPEN = ":hover, :focus-within, [data-peek-open]";
const PEEK_EDGE = 12;

export const TheSentence = memo(function TheSentence({
  className,
  hostname,
  onPreviewToggle,
  onWordHover,
  previewPlaying,
  track,
  wordStagger,
}: {
  className: string;
  hostname: string;
  onPreviewToggle?: () => void;
  onWordHover: (word: SentenceWord | null) => void;
  previewPlaying: boolean;
  track: NowPlaying | null;
  wordStagger: boolean;
}) {
  const identity = getIdentity(hostname);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      const open = document.querySelectorAll(
        ".peek-trigger:hover, .peek-trigger:focus-within"
      );
      for (const trigger of open) {
        trigger.setAttribute("data-peek-closed", "");
      }
      if (open.length > 0) {
        onWordHover(null);
      }
    };
    const onResize = () => {
      for (const trigger of document.querySelectorAll<HTMLElement>(
        `.peek-trigger:is(${OPEN})`
      )) {
        place(trigger);
      }
    };
    addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("resize", onResize);
    };
  }, [onWordHover]);

  let wordCount = 0;
  const nextDelay = () => {
    wordCount += 1;
    return 150 + (wordCount - 1) * 38;
  };

  const word = (node: ReactNode, key?: string) => (
    <span
      className={`word inline-block${wordStagger ? " word-in" : ""}`}
      key={key}
      style={wordStagger ? { animationDelay: `${nextDelay()}ms` } : undefined}
    >
      <span className="word-body inline-block">{node}</span>
    </span>
  );

  const w = (text: string): ReactNode =>
    text
      .split(/(\s+)/)
      .map((token, index) =>
        /^\s*$/.test(token) ? token : word(token, `${token}-${index}`)
      );

  // Punctuation after a linked word stays in its inline-block so it can't wrap alone.
  const wrap = (node: ReactNode, tail?: string) =>
    word(
      <>
        {node}
        {tail}
      </>
    );

  const parts: (
    | string
    | {
        href?: string;
        key: SentenceWord;
        peek: ReactNode;
        text: ReactNode;
        to?: "/blog" | "/status";
        tone?: "name";
      }
  )[] = [
    "hi, i'm ",
    {
      key: "name",
      href: `https://${identity.otherDomain}`,
      text: identity.name,
      tone: "name",
      peek: (
        <TextPeek
          href={`https://${identity.otherDomain}`}
          label={identity.isMridul ? "aka" : "also known as"}
          line={`${identity.otherName} → ${identity.otherDomain}`}
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
    { key: "writes", to: "/blog", text: "write", peek: <PostsPeek /> },
    " about some of them, keep a ",
    {
      key: "workshop",
      to: "/status",
      text: <span style={{ viewTransitionName: "workshop" }}>workshop</span>,
      peek: <WorkshopPeek />,
    },
    " mostly running, and usually have ",
    {
      key: "music",
      href: track?.url,
      text: "something",
      peek: track ? (
        <MusicPeek
          onToggle={onPreviewToggle}
          playing={previewPlaying}
          track={track}
        />
      ) : null,
    },
    " on. ",
  ];

  return (
    <>
      <h1 className={className}>
        {parts.map((part, index) => {
          const next = parts[index + 1];
          return typeof part === "string" ? (
            <Fragment key={part}>
              {w(
                typeof parts[index - 1] === "object"
                  ? part.replace(PUNCTUATION, "")
                  : part
              )}
            </Fragment>
          ) : (
            <Fragment key={part.key}>
              {wrap(
                <Peek
                  hoverKey={part.key}
                  href={part.href}
                  onHover={onWordHover}
                  peek={part.peek}
                  to={part.to}
                  tone={part.tone}
                >
                  {part.text}
                </Peek>,
                typeof next === "string" ? PUNCTUATION.exec(next)?.[0] : ""
              )}
            </Fragment>
          );
        })}
        {wrap(
          <>
            {"say "}
            <Peek
              hoverKey="hi"
              href={LINKS.twitter}
              onHover={onWordHover}
              peek={<HiPeek handle={identity.handle} />}
            >
              hi back
            </Peek>
            <span className={wordStagger ? "full-stop text-rose" : "text-rose"}>
              .
            </span>
          </>
        )}
      </h1>
      {identity.isMridul ? (
        <p
          className={`word mt-6 text-muted text-[clamp(1rem,1.7vw,1.3rem)] italic leading-snug${wordStagger ? " word-in" : ""}`}
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
              href={LINKS.resume}
              onHover={onWordHover}
              peek={
                <TextPeek
                  href={LINKS.resume}
                  label="on paper"
                  line="open the pdf →"
                />
              }
            >
              resume
            </Peek>{" "}
            — for the professionally curious.{"\u00a0"})
          </span>
        </p>
      ) : null}
    </>
  );
});

// Cards open centred above the word; shift or flip them to stay on screen.
function place(trigger: HTMLElement) {
  const peek = trigger.querySelector<HTMLElement>(".peek");
  if (!peek) {
    return;
  }
  const word = trigger.getBoundingClientRect();
  const center = word.left + word.width / 2;
  const half = peek.offsetWidth / 2;
  // The label tab sits half out of the card's top edge.
  const tab =
    (peek.querySelector<HTMLElement>(".peek-tab")?.offsetHeight ?? 0) / 2;
  const x =
    Math.min(
      Math.max(center, half + PEEK_EDGE),
      innerWidth - half - PEEK_EDGE
    ) - center;
  trigger.style.setProperty("--peek-x", `${x}px`);
  // Measured as it sits above. Short of room there, its spare line goes
  // first; if that's not enough, the line stays and the card opens below.
  trigger.removeAttribute("data-peek-below");
  trigger.removeAttribute("data-peek-trim");
  const fits = () => word.top - peek.offsetHeight - tab >= PEEK_EDGE;
  if (fits()) {
    return;
  }
  trigger.setAttribute("data-peek-trim", "");
  if (!fits()) {
    trigger.removeAttribute("data-peek-trim");
    trigger.toggleAttribute(
      "data-peek-below",
      innerHeight - word.bottom > word.top
    );
  }
}

// Arming during the intro would pin the sheet to a word that's still
// transformed; skip to the end first. (Not the caret or equaliser: they loop.)
function finishIntro() {
  for (const animation of document.getAnimations()) {
    if (
      animation instanceof CSSAnimation &&
      (animation.animationName === "word-in" ||
        animation.animationName === "full-stop")
    ) {
      animation.finish();
    }
  }
}

function Peek({
  children,
  hoverKey,
  href,
  onHover,
  peek,
  to,
  tone = "link",
}: {
  children: ReactNode;
  hoverKey: SentenceWord;
  href?: string;
  onHover: (word: SentenceWord | null) => void;
  peek: ReactNode;
  to?: "/blog" | "/status";
  tone?: "link" | "name";
}) {
  const [armed, setArmed] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  // Per gesture, not per device: a finger on a touch laptop arms too.
  const touchRef = useRef(false);
  const linkClass = `sentence-link ${
    tone === "name"
      ? "text-ink decoration-dotted decoration-ink/30 hover:decoration-ink/70"
      : "text-rose italic decoration-rose/30 hover:decoration-rose"
  }`;

  const report = (word: SentenceWord | null) => {
    const trigger = wrapperRef.current;
    if (word && trigger) {
      trigger.removeAttribute("data-peek-closed");
      place(trigger);
    }
    onHover(word);
  };

  useEffect(() => {
    if (!armed) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setArmed(false);
        onHover(null);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [armed, onHover]);

  // A card can grow while it's open (the heatmap arriving): keep it on screen.
  const watchPeek = useCallback((peekEl: HTMLSpanElement | null) => {
    const trigger = peekEl?.parentElement;
    if (!(peekEl && trigger)) {
      return;
    }
    const observer = new ResizeObserver(() =>
      requestAnimationFrame(() => {
        if (trigger.matches(OPEN)) {
          place(trigger);
        }
      })
    );
    observer.observe(peekEl);
    return () => observer.disconnect();
  }, []);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const touch = touchRef.current;
    touchRef.current = false;
    const modified =
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (!modified && (touch || matchMedia(SHEETS).matches)) {
      if (!armed) {
        event.preventDefault();
        finishIntro();
        setArmed(true);
        report(hoverKey);
        if (peek) {
          sfx("tick", NOTES[hoverKey]);
        }
        return;
      }
      setArmed(false);
      // Safari doesn't focus a tapped link, so no blur would clear this.
      onHover(null);
    }
    // Chromium makes a clicked link :focus-visible on the next key press,
    // which would pop its card open again.
    if (event.detail) {
      event.currentTarget.blur();
    }
  };

  const onLinkEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      sfx("pop");
    }
  };

  const onLinkDown = (event: PointerEvent) => {
    touchRef.current = event.pointerType === "touch";
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: relays focus state of the link and card inside it
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same; the interactive elements are the children
    <span
      className="peek-trigger relative inline-block"
      data-peek-open={armed ? "" : undefined}
      onBlur={(event) => {
        const trigger = wrapperRef.current;
        if (!trigger || trigger.contains(event.relatedTarget)) {
          return;
        }
        trigger.removeAttribute("data-peek-closed");
        setArmed(false);
        if (matchMedia(SHEETS).matches || !trigger.matches(":hover")) {
          onHover(null);
        }
      }}
      onFocus={() => {
        if (!matchMedia(SHEETS).matches) {
          report(hoverKey);
        }
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch" && !matchMedia(SHEETS).matches) {
          report(hoverKey);
        }
      }}
      onPointerLeave={(event) => {
        const trigger = wrapperRef.current;
        // Keyboard focus keeps the card, or an Escape that closed it, until
        // focus moves on.
        if (
          event.pointerType === "touch" ||
          armed ||
          !trigger ||
          trigger.matches(":has(:focus-visible)")
        ) {
          return;
        }
        trigger.removeAttribute("data-peek-closed");
        onHover(null);
      }}
      ref={wrapperRef}
    >
      {to ? (
        <Link
          className={linkClass}
          onClick={onClick}
          onPointerDown={onLinkDown}
          onPointerEnter={onLinkEnter}
          to={to}
        >
          {children}
        </Link>
      ) : href ? (
        <a
          className={linkClass}
          href={href}
          onClick={onClick}
          onPointerDown={onLinkDown}
          onPointerEnter={onLinkEnter}
          rel="noopener noreferrer"
          target="_blank"
        >
          {children}
        </a>
      ) : (
        <span className={linkClass}>{children}</span>
      )}
      {peek ? (
        <span className="peek" ref={watchPeek}>
          {peek}
        </span>
      ) : null}
      {armed ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: tap-catcher; dismissal also works via focus loss
        // biome-ignore lint/a11y/useKeyWithClickEvents: touch-only affordance
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: touch-only tap-catcher
        <span
          className="fixed inset-0 z-30"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setArmed(false);
            onHover(null);
          }}
        />
      ) : null}
    </span>
  );
}

function PeekCard({
  children,
  compact = false,
  fit = false,
  label,
}: {
  children: ReactNode;
  compact?: boolean;
  fit?: boolean;
  label: string;
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
      <span className="peek-tab">{label}</span>
      {children}
    </span>
  );
}

function TextPeek({
  href,
  label,
  line,
}: {
  href: string;
  label: string;
  line: string;
}) {
  return (
    <PeekCard compact label={label}>
      <a
        className="block whitespace-nowrap text-ink text-xs transition-colors duration-150 hover:text-rose"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {line}
      </a>
    </PeekCard>
  );
}

function HiPeek({ handle }: { handle: string }) {
  const [copied, copy] = useCopied();
  const [touch, setTouch] = useState(false);
  const hi = useSiteStats()?.hi ?? 0;

  useEffect(() => {
    setTouch(isTouch());
  }, []);

  const onEmail = (event: MouseEvent<HTMLAnchorElement>) => {
    beacon({ type: "hi" });
    if (touch) {
      return;
    }
    event.preventDefault();
    copy(EMAIL).then((ok) => {
      if (!ok) {
        location.href = LINKS.email;
      }
    });
  };

  return (
    <PeekCard fit label="say hi">
      <a className="group block" href={LINKS.email} onClick={onEmail}>
        <span className="block whitespace-nowrap text-ink text-xs group-hover:text-rose">
          <span className="hi-email" data-done={copied ? "" : undefined}>
            {EMAIL}
          </span>
          <span
            aria-hidden="true"
            className="hi-caret"
            data-done={copied ? "" : undefined}
          />
        </span>
        <span className="block whitespace-nowrap text-[10px] text-muted">
          <span aria-live="polite" className="swap-in" key={String(copied)}>
            {copied
              ? "( copied )"
              : touch
                ? "opens your mail app"
                : "click to copy"}
          </span>
        </span>
      </a>
      <a
        className="group mt-2.5 block"
        href={LINKS.twitter}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="block whitespace-nowrap text-ink text-xs group-hover:text-rose">
          @{handle}
        </span>
        <span className="block whitespace-nowrap text-[10px] text-muted">
          strangers welcome
        </span>
      </a>
      {hi > 0 ? (
        <span className="mt-3 block border-ink/10 border-t pt-2 text-center text-[9px] text-faint tracking-[0.1em]">
          {hi === 1 ? "one person" : `${hi} people`} said hi this month
        </span>
      ) : null}
    </PeekCard>
  );
}

interface Contributions {
  total: number;
  weeks: number[][];
}

function useContributions() {
  const [data, setData] = useState<Contributions | null>(null);
  useEffect(
    () =>
      whenIdle(() => {
        getJson<Contributions>("/api/github/contributions").then(setData);
      }),
    []
  );
  return data;
}

function Heatmap({ total, weeks }: Contributions) {
  return (
    <a
      className="group mt-3 block border-ink/10 border-t pt-3 [@media(max-height:500px)]:hidden"
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
                    level < 0 ? "transparent" : `var(--heat-${level})`,
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
          data-peek-spare={project.spare ? "" : undefined}
          href={project.href}
          key={project.name}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="block font-medium text-ink text-xs group-hover:text-rose">
            {project.name}
          </span>
          <span className="block text-muted text-[11px]">
            {project.description}
          </span>
        </a>
      ))}
      {graph && graph.weeks.length > 0 ? <Heatmap {...graph} /> : null}
    </PeekCard>
  );
}

// Seeded, clock-free: the peek shows the same picture on the server and client.
const WORKSHOP = mockFleet(0);

const WorkshopPeek = memo(function WorkshopPeek() {
  const [fleet, setFleet] = useState(WORKSHOP);
  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }
    return whenIdle(() => {
      getJson<Fleet>("/api/fleet").then((live) => live && setFleet(live));
    });
  }, []);
  return (
    <Link className="block" to="/status">
      <PeekCard label="the workshop">
        {fleet.hosts.map((host, index) => (
          <span className="fleet-peek-row" key={host.id}>
            <Lamp health={host.health} />
            <span className="truncate text-ink text-xs">{host.id}</span>
            <Sparkline
              className={host.health === "up" ? "text-rose" : "text-faint"}
              data={host.cpuSpark.slice(-24)}
              delay={index * 80}
              height={14}
              max={100}
            />
            <span className="text-right text-[10px] text-muted tabular-nums">
              {host.health === "up" ? `${host.cpu}%` : host.health}
            </span>
          </span>
        ))}
      </PeekCard>
    </Link>
  );
});

function PostsPeek() {
  const paths = useSiteStats()?.paths;
  return (
    <PeekCard label="recent writing">
      {PUBLISHED_META.map((post, index) => {
        const reads = paths?.[`/blog/${post.slug}`] ?? 0;
        return (
          <Link
            className={`group block ${index > 0 ? "mt-2.5" : ""}`}
            key={post.slug}
            params={{ slug: post.slug }}
            to="/blog/$slug"
          >
            <span className="block truncate text-ink text-xs group-hover:text-rose">
              {post.title}
            </span>
            <span className="block text-muted text-[10px] tabular-nums">
              {post.date.slice(0, 7)}
              {reads > 0 ? (
                <span className="text-faint">
                  {" · "}
                  {compact(reads)} {reads === 1 ? "read" : "reads"}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
      <span className="mt-2.5 block">
        <span className="block whitespace-nowrap text-faint text-xs italic">
          it&apos;s been a while
        </span>
        <span className="block text-[10px] text-faint tabular-nums">
          2026-??
        </span>
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

function MusicPeek({
  onToggle,
  playing,
  track,
}: {
  onToggle?: () => void;
  playing: boolean;
  track: NowPlaying;
}) {
  const { isPlaying } = track;
  const albumArt =
    track.image.find((image) => image.size === "medium")?.["#text"] ?? "";
  return (
    <PeekCard
      compact={!isPlaying}
      label={isPlaying ? "right now" : "last played"}
    >
      <span className={`flex items-center ${isPlaying ? "gap-3" : "gap-2.5"}`}>
        {albumArt ? (
          <span className="relative shrink-0">
            <img
              alt=""
              className={`block rounded-md object-cover ${isPlaying ? "h-12 w-12" : "h-10 w-10"}`}
              height={isPlaying ? 48 : 40}
              loading="lazy"
              referrerPolicy="no-referrer"
              src={albumArt}
              width={isPlaying ? 48 : 40}
            />
            {onToggle ? (
              <button
                aria-label={playing ? "pause the preview" : "play a preview"}
                className="peek-play"
                data-playing={playing ? "" : undefined}
                onClick={() => {
                  sfx(playing ? "pause" : "play");
                  onToggle();
                }}
                type="button"
              >
                <span>
                  <Icon name={playing ? "pause" : "play"} />
                </span>
              </button>
            ) : null}
          </span>
        ) : null}
        <a
          className={`group flex min-w-0 items-center ${isPlaying ? "flex-1 gap-3" : "gap-2.5"}`}
          href={track.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink text-xs group-hover:text-rose">
              {track.name}
            </span>
            <span className="block truncate text-muted text-[11px]">
              {track.artist}
            </span>
          </span>
          {isPlaying ? <WaveEq /> : null}
        </a>
      </span>
    </PeekCard>
  );
}
