import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Guestbook from "@/components/guestbook";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import TintStrips from "@/components/tint-strips";
import { baseUrlOf, embedLink, preloadFont } from "@/lib/head";
import { type SiteStats, visitorTag } from "@/lib/stats";
import { useNowPlaying } from "@/lib/use-now-playing";
import { usePreview } from "@/lib/use-preview";
import { useSiteStats, visitor } from "@/lib/use-stats";
import instrumentItalicWoff2 from "../fonts/instrument-serif-latin-italic.woff2?url";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  component: Home,
  head: ({ matches }) => ({
    links: [
      embedLink(`${baseUrlOf(matches)}/api/embed.json`),
      preloadFont(instrumentItalicWoff2),
    ],
  }),
});

const MODES: Record<SentenceWord, RoseMode> = {
  name: "shiver",
  builds: "cube",
  writes: "caret",
  workshop: "churn",
  music: "art",
  hi: "hi",
  resume: "paper",
};

const CAPTIONS: Record<SentenceWord, string> = {
  name: "( flustered )",
  builds: "( assembling )",
  writes: "( waiting for the first word )",
  workshop: "( keeping the lights on )",
  music: "( listening for something )",
  hi: "( saying it back )",
  resume: "( pretending to be a document )",
};

// Tuned for a phone page that fits the screen; --below adds whatever is still
// under the fold. They also decide whether the rose's caption shows: for builds,
// writes, workshop and hi the card sits over it on purpose. In landscape the
// rose can't clear a sheet, so it stays put behind it.
const LIFTS: Record<SentenceWord, string> = {
  name: "max-md:portrait:-translate-y-[calc(50px_+_var(--below))]",
  builds: "max-md:portrait:-translate-y-[calc(218px_+_var(--below))]",
  writes: "max-md:portrait:-translate-y-[calc(66px_+_var(--below))]",
  workshop: "max-md:portrait:-translate-y-[calc(98px_+_var(--below))]",
  music: "max-md:portrait:-translate-y-[calc(85px_+_var(--below))]",
  hi: "max-md:portrait:-translate-y-[calc(66px_+_var(--below))]",
  resume: "max-md:portrait:-translate-y-[calc(50px_+_var(--below))]",
};
const MUSIC_COMPACT_LIFT =
  "max-md:portrait:-translate-y-[calc(73px_+_var(--below))]";

const GREETING_MS = 4200;
const NOTE_EVERY_MS = 11_000;
const NOTE_FOR_MS = 3800;
const RECENT_AGO_RE = /^(just now|[1-4]m)$/;

const roseNotes = (stats: SiteStats | null) => {
  if (!stats) {
    return [];
  }
  const notes: string[] = [];
  // Assumes this visit is counted: at worst, one person too few.
  const others = stats.online - 1;
  if (others === 1) {
    notes.push("( one other person is looking at this )");
  } else if (others > 1) {
    notes.push(`( ${others} others are looking at this )`);
  }
  const mine = visitorTag(visitor());
  const arrival = stats.recent.find(
    (r) =>
      r.tag !== mine && RECENT_AGO_RE.test(r.ago) && r.place !== "somewhere"
  );
  if (arrival) {
    notes.push(`( someone in ${arrival.place} just arrived )`);
  }
  if (stats.today >= 10) {
    notes.push(`( ${stats.today} of you today. hi. )`);
  }
  return notes;
};

const HOST_PREFIX_RE = /^(?:www|m|l|lm|old|mobile|out|link)\./;
const HOST_ALIASES: Record<string, string> = {
  "t.co": "x.com",
  "twitter.com": "x.com",
  "lnkd.in": "linkedin.com",
  "news.ycombinator.com": "hacker news",
  "com.google.android.gm": "gmail",
  "mail.google.com": "gmail",
};

const referrerHost = () => {
  try {
    const host = new URL(document.referrer).hostname.replace(
      HOST_PREFIX_RE,
      ""
    );
    if (!host || host === location.hostname) {
      return null;
    }
    return HOST_ALIASES[host] ?? host;
  } catch {
    return null;
  }
};

function useRoseNote(idle: boolean, stats: SiteStats | null, greet: boolean) {
  const [note, setNote] = useState<string | null>(null);
  const notesRef = useRef<string[]>([]);
  notesRef.current = roseNotes(stats);

  useEffect(() => {
    const host = greet ? referrerHost() : null;
    if (!host) {
      return;
    }
    setNote(`( ${host} sent you. hi. )`);
    const timer = setTimeout(() => setNote(null), GREETING_MS);
    return () => clearTimeout(timer);
  }, [greet]);

  useEffect(() => {
    if (!idle) {
      setNote(null);
      return;
    }
    let i = 0;
    let hide: ReturnType<typeof setTimeout>;
    const show = setInterval(() => {
      const notes = notesRef.current;
      if (notes.length === 0) {
        return;
      }
      setNote(notes[i % notes.length]);
      i += 1;
      hide = setTimeout(() => setNote(null), NOTE_FOR_MS);
    }, NOTE_EVERY_MS);
    return () => {
      clearInterval(show);
      clearTimeout(hide);
    };
  }, [idle]);

  return note;
}

let introPlayed = false;

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const [intro] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);
  const { artFadeRef, previewing, previewUrl, toggle, track, warm } =
    usePreview(useNowPlaying());
  const [word, setWord] = useState<SentenceWord | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [below, setBelow] = useState(0);

  // A card can't be open while the page scrolls; only a resize moves this.
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!(word && main)) {
      return;
    }
    const measure = () =>
      setBelow(main.scrollHeight - main.clientHeight - main.scrollTop);
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [word]);

  useEffect(() => {
    if (word === "music") {
      warm();
    }
  }, [word, warm]);

  // The rose samples a 27x27 grid of it, so the smallest cover will do.
  const albumArt =
    track?.image.find((image) => image.size === "small")?.["#text"] ??
    track?.image.find((image) => image.size === "medium")?.["#text"] ??
    null;

  const mode = word ? MODES[word] : previewing ? "art" : "rest";
  const stats = useSiteStats();
  const roseNote = useRoseNote(!(word || previewing), stats, intro);

  const caption = (() => {
    if (roseNote) {
      return roseNote;
    }
    if (word === "music" || (!word && previewing)) {
      if (previewing) {
        return "( humming along )";
      }
      if (albumArt) {
        return previewUrl
          ? "( dressed as the cover, press play )"
          : "( dressed as the album cover )";
      }
      return CAPTIONS.music;
    }
    return word ? CAPTIONS[word] : "( alive, technically )";
  })();

  const liftClass = word
    ? word === "music" && !track?.isPlaying
      ? MUSIC_COMPACT_LIFT
      : LIFTS[word]
    : "";

  return (
    <main
      className="fixed inset-0 overflow-y-auto paper paper-lit font-serif-display text-ink"
      ref={mainRef}
    >
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between gap-8 px-7 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-normal md:gap-14 md:py-[min(4rem,9vh)] md:pr-[max(3rem,env(safe-area-inset-right))] md:pl-[max(3rem,env(safe-area-inset-left))]">
        <div className="sentence-root relative max-w-2xl md:flex-1">
          <TheSentence
            className="text-[clamp(1.9rem,8.6vw,2.5rem)] leading-[1.22] tracking-[-0.01em] md:text-[clamp(1.9rem,4.4vw,3.5rem)] md:leading-[1.2]"
            hostname={hostname}
            onPreviewToggle={previewUrl ? toggle : undefined}
            onWordHover={setWord}
            previewPlaying={previewing}
            track={track}
            wordStagger={intro}
          />
        </div>

        <div
          className={`${intro ? "rise " : ""}relative z-20 flex shrink-0 flex-col items-center md:z-auto`}
          style={{ animationDelay: "200ms" }}
        >
          <div
            className={`flex flex-col items-center transition-transform duration-300 ease-strong ${liftClass}`}
            style={{ "--below": `${below}px` } as CSSProperties}
          >
            <ParticleRose
              artFadeRef={artFadeRef}
              artUrl={albumArt}
              className="w-[min(64vw,300px)] md:w-[min(34vw,440px)]"
              intro={intro}
              mode={mode}
            />
            <p
              aria-hidden="true"
              className="mt-2.5 hidden h-4 font-mono text-faint text-[10px] italic md:block"
            >
              <span className="swap-in" key={caption}>
                {caption}
              </span>
            </p>
            <Guestbook caption={caption} />
          </div>
        </div>
      </div>
      <TintStrips />
    </main>
  );
}
