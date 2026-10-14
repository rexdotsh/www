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
import {
  HiPeek,
  MusicPeek,
  PostsPeek,
  ProjectsPeek,
  TextPeek,
  WorkshopPeek,
} from "@/components/peek-cards";
import { getIdentity, LINKS } from "@/lib/content";
import { SCALE, sfx } from "@/lib/sfx";
import type { NowPlaying } from "@/lib/spotify";

export type SentenceWord =
  | "name"
  | "builds"
  | "writes"
  | "workshop"
  | "music"
  | "hi"
  | "resume";

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
        tail?: string;
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
      tail: ".",
      tone: "name",
      peek: (
        <TextPeek
          href={`https://${identity.otherDomain}`}
          label={identity.isMridul ? "aka" : "also known as"}
          line={`${identity.otherName} → ${identity.otherDomain}`}
        />
      ),
    },
    " i ",
    {
      key: "builds",
      href: LINKS.github,
      text: "build things",
      tail: ",",
      peek: <ProjectsPeek />,
    },
    " i ",
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
        {parts.map((part, index) =>
          typeof part === "string" ? (
            <Fragment key={index}>{w(part)}</Fragment>
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
                part.tail
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
            — for the professionally curious.{"\u00A0"})
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

const onLinkEnter = (event: PointerEvent) => {
  if (event.pointerType !== "touch") {
    sfx("pop");
  }
};

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

  const link = {
    className: `sentence-link ${
      tone === "name"
        ? "text-ink decoration-dotted decoration-ink/30 hover:decoration-ink/70"
        : "text-rose italic decoration-rose/30 hover:decoration-rose"
    }`,
    onClick,
    onPointerDown: (event: PointerEvent) => {
      touchRef.current = event.pointerType === "touch";
    },
    onPointerEnter: onLinkEnter,
  };

  return (
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
        <Link {...link} to={to}>
          {children}
        </Link>
      ) : href ? (
        <a {...link} href={href} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <span className={link.className}>{children}</span>
      )}
      {peek ? (
        <span className="peek" ref={watchPeek}>
          {peek}
        </span>
      ) : null}
      {armed ? (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- a touch-only tap-catcher; dismissal also works via focus loss
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
