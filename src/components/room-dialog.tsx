import { Link } from "@tanstack/react-router";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  FLOWERS,
  getIdentity,
  LINKS,
  PROJECTS,
  type Room,
  ROOMS,
} from "@/lib/content";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { sfx } from "@/lib/sfx";
import { useGitHubDesk } from "@/lib/use-github-desk";
import type { SpotifyTrack } from "@/lib/use-now-playing";

interface RoomDialogProps {
  hostname: string;
  onClose: () => void;
  onOpen: (room: Room) => void;
  onPreview?: () => void;
  playing: boolean;
  progress: number;
  room: Room | null;
  track: SpotifyTrack | null;
}

function Out({
  children,
  href,
  className = "room-link",
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("copied ✓");
      sfx("chime");
    } catch {
      setMessage("couldn’t copy — try again");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 2400);
  };
  return (
    <button className="room-copy" onClick={copy} type="button">
      <span aria-live="polite">{message || label}</span>
    </button>
  );
}

export default function RoomDialog({
  hostname,
  room,
  onOpen,
  onClose,
  track,
  playing,
  progress,
  onPreview,
}: RoomDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [lastRoom, setLastRoom] = useState<Room>(room ?? "work");
  const [shareUrl, setShareUrl] = useState("");
  const active = room ?? lastRoom;
  const info = ROOMS.find((item) => item.id === active) ?? ROOMS[0];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (room) {
      setLastRoom(room);
      setShareUrl(window.location.href);
      if (!element.open) element.showModal();
      if (room === "index")
        element
          .querySelector<HTMLInputElement>(".index-search input")
          ?.focus({ preventScroll: true });
      else title.current?.focus({ preventScroll: true });
      return;
    }
    if (!element.open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.close();
      return;
    }
    const animation = element.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(8px) scale(.985)" },
      ],
      { duration: 150, easing: "ease-out" }
    );
    animation.finished.then(() => element.close()).catch(() => undefined);
    return () => animation.cancel();
  }, [room]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native dialog provides Escape; click handles only its backdrop
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: native dialog backdrop dismissal; interactive content is inside the shell
    <dialog
      aria-labelledby="room-title"
      id="space-room"
      className="room-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialog}
    >
      <div className="room-shell">
        <header className="room-header">
          <div>
            <span className="room-number">
              {String(ROOMS.indexOf(info) + 1).padStart(2, "0")} /
            </span>
            <h2 id="room-title" ref={title} tabIndex={-1}>
              {info.label}
            </h2>
          </div>
          <button
            aria-label="Close room"
            className="room-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <nav aria-label="Explore rooms" className="room-tabs">
          {ROOMS.map((item) => (
            <button
              aria-current={active === item.id ? "page" : undefined}
              key={item.id}
              onClick={() => onOpen(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.glyph}</span>
              {item.short}
            </button>
          ))}
        </nav>
        <div className="room-body" key={active}>
          {active === "work" ? (
            <WorkRoom enabled={room === "work"} />
          ) : active === "writing" ? (
            <WritingRoom />
          ) : active === "listening" ? (
            <ListeningRoom
              onPreview={onPreview}
              playing={playing}
              progress={progress}
              track={track}
            />
          ) : active === "garden" ? (
            <GardenRoom />
          ) : active === "about" ? (
            <AboutRoom hostname={hostname} />
          ) : (
            <IndexRoom onOpen={onOpen} />
          )}
        </div>
        <footer className="room-footer">
          <span>one small corner of the internet</span>
          <CopyButton label="copy a link to this room ↗" value={shareUrl} />
        </footer>
      </div>
    </dialog>
  );
}

function WorkRoom({ enabled }: { enabled: boolean }) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"projects" | "activity">("projects");
  const { data, status, retry } = useGitHubDesk(enabled);
  const project = PROJECTS[selected];
  const live = data?.repositories.find((repo) => repo.name === project.name);
  return (
    <>
      <div className="room-intro-row">
        <p className="room-kicker">software, mostly. curiosity, always.</p>
        <div className="room-segment" aria-label="Work view" role="group">
          <button
            aria-pressed={view === "projects"}
            onClick={() => setView("projects")}
            type="button"
          >
            selected
          </button>
          <button
            aria-pressed={view === "activity"}
            onClick={() => setView("activity")}
            type="button"
          >
            from github <span className="live-dot" />
          </button>
        </div>
      </div>
      {view === "projects" ? (
        <div className="project-dossier">
          <div
            className="dossier-list"
            aria-label="Select a project"
            role="group"
          >
            {PROJECTS.map((item, index) => (
              <button
                aria-pressed={selected === index}
                key={item.name}
                onClick={() => {
                  setSelected(index);
                  sfx("tick");
                }}
                type="button"
              >
                <span className="dossier-index">0{index + 1}</span>
                <span>
                  {item.name === "claudesync-vscode" ? "claudesync" : item.name}
                  <small>{item.language}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <article className="dossier-detail" key={project.name}>
            <div className="dossier-art" aria-hidden="true">
              <span>{project.glyph}</span>
              <i />
              <small>{project.category}</small>
            </div>
            <div className="dossier-title">
              <h3>
                {project.name === "claudesync-vscode"
                  ? "claudesync"
                  : project.name}
              </h3>
              {live ? (
                <span className="repo-stars" title="Public GitHub stars">
                  ✧ {live.stars}
                </span>
              ) : null}
            </div>
            <p className="room-prose">{project.detail}</p>
            <p className="dossier-stack">{project.stack}</p>
            <Out href={project.href}>open the source</Out>
            <p className="dossier-footnote">
              {live
                ? `pushed ${new Date(live.updated).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} · `
                : ""}
              {project.note}
            </p>
          </article>
        </div>
      ) : (
        <div className="activity-room">
          <h3 className="room-display">
            A few recent <em>footprints.</em>
          </h3>
          <p className="room-prose">
            Public activity from GitHub. A glimpse of what’s moving.
          </p>
          {status === "loading" ? (
            <p className="room-empty" role="status">
              following the trail…
            </p>
          ) : status === "unavailable" ? (
            <div className="room-empty">
              <p>GitHub is taking a moment. The projects are still here.</p>
              <button className="room-link" onClick={retry} type="button">
                try again ↻
              </button>
            </div>
          ) : data?.activity.length ? (
            <ul className="activity-list">
              {data.activity.map((event) => (
                <li key={event.id}>
                  <span className="activity-node" />
                  <div>
                    <span>{event.action}</span>
                    <Out href={event.url}>{event.repository}</Out>
                  </div>
                  <time dateTime={event.date}>
                    {new Date(event.date).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="room-empty">
              A quiet patch on the public feed. Probably building something.
            </p>
          )}
          <Out href={LINKS.github}>the full picture on github</Out>
        </div>
      )}
    </>
  );
}

function WritingRoom() {
  return (
    <div className="notebook-room">
      <div className="notebook-heading">
        <p className="room-kicker">infrequent. sometimes long.</p>
        <h3 className="room-display">
          Notes from
          <br />
          <em>the rabbit hole.</em>
        </h3>
        <span aria-hidden="true">¶</span>
      </div>
      {PUBLISHED_META.map((post) => (
        <Link
          className="notebook-entry"
          key={post.slug}
          params={{ slug: post.slug }}
          to="/blog/$slug"
        >
          <span className="room-kicker">
            {post.dateLabel} <span> / {post.meta[0]}</span>
          </span>
          <h4>
            {post.title}
            <span aria-hidden="true">↗</span>
          </h4>
          <p className="room-prose">{post.description}</p>
          <span className="notebook-tags">
            {post.meta.slice(1).join(" · ")}
          </span>
        </Link>
      ))}
      <div className="notebook-links">
        <Out href={LINKS.archive}>older ctf writeups</Out>
        <Link className="room-link" to="/blog">
          all writing <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function ListeningRoom({
  track,
  playing,
  progress,
  onPreview,
}: Pick<RoomDialogProps, "track" | "playing" | "progress" | "onPreview">) {
  const art = track?.image.find((image) => image.size === "large")?.["#text"];
  return (
    <div className="listening-room">
      <div className="record-player" data-playing={playing || undefined}>
        <div className="record-grooves">
          <div className="record-label">
            {art ? (
              <img
                alt=""
                height={120}
                referrerPolicy="no-referrer"
                src={art}
                width={120}
              />
            ) : (
              <span aria-hidden="true">♫</span>
            )}
          </div>
        </div>
        <span className="record-needle" />
        <span className="record-caption">side a / whatever’s on</span>
      </div>
      <div className="listening-copy">
        <p className="room-kicker">
          <span className={track?.isPlaying ? "live-dot" : "quiet-dot"} />{" "}
          {track?.isPlaying
            ? "on the speakers right now"
            : track
              ? "last on the speakers"
              : "a little quiet right now"}
        </p>
        <h3 className="room-display">{track?.name ?? "Between records."}</h3>
        <p className="record-artist">
          {track?.artist ?? "The next song will find its way here."}
        </p>
        {track?.album ? <p className="record-album">{track.album}</p> : null}
        {onPreview ? (
          <>
            <button className="listen-button" onClick={onPreview} type="button">
              <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
              {playing ? "stop the preview" : "listen for a little"}
            </button>
            <div
              aria-label="Preview progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress * 100)}
              className="record-progress"
              role="progressbar"
              style={
                { "--record-progress": `${progress * 100}%` } as CSSProperties
              }
            >
              <span />
            </div>
          </>
        ) : (
          <p className="record-unavailable">
            {track
              ? "No preview for this one. The full track is on Spotify."
              : "Listening updates arrive here automatically."}
          </p>
        )}
        {track ? <Out href={track.url}>open in spotify</Out> : null}
        <p className="listening-footnote">
          {playing
            ? "the rose is wearing the album cover."
            : "a soundtrack for this little corner."}
        </p>
      </div>
    </div>
  );
}

function GardenRoom() {
  return (
    <div className="garden-room">
      <p className="room-kicker">flora / a workshop with friends</p>
      <h3 className="room-display">
        Small things.
        <br />
        <em>Shared soil.</em>
      </h3>
      <p className="room-prose garden-intro">
        Random utilities for the web, with botanical names. Some useful, some
        just because.
      </p>
      <div className="flower-shelf">
        {FLOWERS.map((flower, index) => (
          <a
            className="flower-pot"
            href={flower.href}
            key={flower.name}
            rel="noopener noreferrer"
            style={
              { "--flower-turn": `${index * 15 - 12}deg` } as CSSProperties
            }
            target="_blank"
          >
            <span className="flower-head" aria-hidden="true">
              {flower.glyph}
            </span>
            <span className="flower-stem" aria-hidden="true" />
            <h4>
              {flower.name}
              <span aria-hidden="true">↗</span>
            </h4>
            <p>{flower.description}</p>
          </a>
        ))}
      </div>
      <Out href={LINKS.flora}>visit the shared workshop</Out>
    </div>
  );
}

function AboutRoom({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  return (
    <div className="about-room">
      <div className="identity-card">
        <span className="room-kicker">one person / two names</span>
        <div className="identity-monogram" aria-hidden="true">
          m<span>r.</span>
        </div>
        <p>
          {identity.name}
          <span>also {identity.otherName}</span>
        </p>
        <span className="identity-location">somewhere on the internet</span>
      </div>
      <div className="about-copy">
        <p className="room-kicker">for the person on the other side</p>
        <h3 className="room-display">
          Hi, I’m <em>mridul.</em>
        </h3>
        <p className="room-prose">
          I go by rex online. I build full-stack software, make tools for the
          way I work, and occasionally disappear into a reverse-engineering
          challenge.
        </p>
        <p className="about-aside">
          “solving problems, occasionally creating them”
          <span>— the github bio</span>
        </p>
        <div className="contact-links">
          <a className="room-link" href={LINKS.email}>
            hey@mridul.sh <span aria-hidden="true">↗</span>
          </a>
          <CopyButton label="copy email" value="hey@mridul.sh" />
          <Out href={LINKS.twitter}>@{identity.handle}</Out>
          <Out href={LINKS.github}>github / rexdotsh</Out>
        </div>
        <p className="about-footnote">
          Interesting projects, strange ideas, or just a hello. All welcome.
        </p>
      </div>
    </div>
  );
}

function IndexRoom({ onOpen }: { onOpen: (room: Room) => void }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const normalized = query.trim().toLowerCase();
  const rooms = ROOMS.filter(
    (item) =>
      item.id !== "index" &&
      `${item.id} ${item.label} ${item.short} ${item.hint}`
        .toLowerCase()
        .includes(normalized)
  );
  const projects = normalized
    ? PROJECTS.filter((item) =>
        `${item.name} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(normalized)
      )
    : [];
  const posts = normalized
    ? PUBLISHED_META.filter((item) =>
        `${item.title} ${item.description}`.toLowerCase().includes(normalized)
      )
    : [];
  const empty = !(rooms.length || projects.length || posts.length);
  return (
    <div className="index-room">
      <label className="index-search">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="Search this space"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "Enter") return;
            const first =
              results.current?.querySelector<HTMLElement>("button, a");
            if (!first) return;
            event.preventDefault();
            if (event.key === "Enter") first.click();
            else first.focus();
          }}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="a project, a thought, a place…"
          ref={input}
          type="search"
          value={query}
        />
      </label>
      <p className="room-kicker" aria-live="polite">
        {normalized
          ? `${rooms.length + projects.length + posts.length} places found`
          : "a few doors you can open"}
      </p>
      <div className="index-results" ref={results}>
        {rooms.map((item) => (
          <button
            className="index-result"
            key={item.id}
            onClick={() => onOpen(item.id)}
            type="button"
          >
            <span className="index-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span>
              {item.label}
              <small>{item.hint}</small>
            </span>
            <span aria-hidden="true">↵</span>
          </button>
        ))}
        {projects.map((item) => (
          <Out className="index-result" href={item.href} key={item.name}>
            <span className="index-glyph" aria-hidden="true">
              ⌘
            </span>
            <span>
              {item.name}
              <small>{item.description}</small>
            </span>
          </Out>
        ))}
        {posts.map((post) => (
          <Link
            className="index-result"
            key={post.slug}
            params={{ slug: post.slug }}
            to="/blog/$slug"
          >
            <span className="index-glyph" aria-hidden="true">
              ¶
            </span>
            <span>
              {post.title}
              <small>{post.description}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
        {empty ? (
          <p className="room-empty">
            Nothing filed under “{query}” yet. Try “tools”, “music”, or “ctf”.
          </p>
        ) : null}
      </div>
      <p className="index-footnote">
        <kbd>tab</kbd> to wander <span>·</span>
        <kbd>enter</kbd> to open <span>·</span>
        <kbd>esc</kbd> to come home
      </p>
    </div>
  );
}
