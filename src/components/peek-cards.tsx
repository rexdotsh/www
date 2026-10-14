import { Link } from "@tanstack/react-router";
import {
  memo,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Lamp, Sparkline } from "@/components/fleet";
import Icon from "@/components/icon";
import { EMAIL, LINKS, PROJECTS } from "@/lib/content";
import { type Fleet, mockFleet } from "@/lib/fleet";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { sfx } from "@/lib/sfx";
import type { NowPlaying } from "@/lib/spotify";
import { compact } from "@/lib/stats";
import { useCopied } from "@/lib/use-copied";
import { beacon, useSiteStats } from "@/lib/use-stats";
import { getJson, isTouch, whenIdle } from "@/lib/utils";

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

export function TextPeek({
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

export function HiPeek({ handle }: { handle: string }) {
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
    void copy(EMAIL).then((ok) => {
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
        void getJson<Contributions>("/api/github/contributions").then(setData);
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

export function ProjectsPeek() {
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

export const WorkshopPeek = memo(function WorkshopPeek() {
  const [fleet, setFleet] = useState(WORKSHOP);
  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }
    return whenIdle(() => {
      void getJson<Fleet>("/api/fleet").then((live) => live && setFleet(live));
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

export function PostsPeek() {
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

export function MusicPeek({
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
