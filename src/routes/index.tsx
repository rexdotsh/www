import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import TintStrips from "@/components/tint-strips";
import RoomDialog from "@/components/room-dialog";
import { getIdentity, type Room, ROOMS } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { type SpotifyTrack, useNowPlaying } from "@/lib/use-now-playing";
import { usePreview } from "@/lib/use-preview";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { room?: Room } => ({
    room: ROOMS.find((item) => item.id === search.room)?.id,
  }),
  component: Home,
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

const MODES: Record<SentenceWord, RoseMode> = {
  name: "shiver",
  builds: "cube",
  writes: "caret",
  garden: "garden",
  music: "art",
  hi: "hi",
  resume: "paper",
};

const CAPTIONS: Record<SentenceWord, string> = {
  name: "( flustered )",
  builds: "( assembling )",
  writes: "( waiting for the first word )",
  garden: "( becoming a garden )",
  music: "( keeping time )",
  hi: "( saying it back )",
  resume: "( pretending to be a document )",
};

const WORD_ROOMS: Record<SentenceWord, Room> = {
  name: "about",
  builds: "work",
  writes: "writing",
  garden: "garden",
  music: "listening",
  hi: "about",
  resume: "about",
};
const SCULPTURES = [
  { mode: "rest", label: "rose", caption: "( alive, technically )" },
  { mode: "cube", label: "structure", caption: "( a little more together )" },
  { mode: "garden", label: "garden", caption: "( better with company )" },
  { mode: "orbit", label: "orbit", caption: "( somewhere else entirely )" },
] as const;

// Keep previews quieter on touch devices.
const VOLUME = 0.5;
const VOLUME_TOUCH = 0.28;

const isTouch = () => window.matchMedia("(hover: none)").matches;

interface Preview {
  track: SpotifyTrack;
  url: string;
}

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const identity = getIdentity(hostname);
  const { room: searchRoom } = Route.useSearch();
  const room = searchRoom ?? null;
  const navigate = Route.useNavigate();
  const [sculpture, setSculpture] = useState(0);
  const openRoom = useCallback(
    (next: Room) => {
      sfx("pop");
      navigate({ search: { room: next }, viewTransition: false });
    },
    [navigate]
  );
  const closeRoom = useCallback(() => {
    navigate({ search: {}, viewTransition: false });
  }, [navigate]);
  const exploreWord = useCallback(
    (next: SentenceWord) => openRoom(WORD_ROOMS[next]),
    [openRoom]
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const command =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const typing =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
      if (
        command ||
        (event.key === "/" &&
          !typing &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey)
      ) {
        event.preventDefault();
        if (room === "index") closeRoom();
        else openRoom("index");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [room, openRoom, closeRoom]);
  const live = useNowPlaying();
  const [word, setWord] = useState<SentenceWord | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const track = preview?.track ?? live.track;
  const previewUrl = preview?.url ?? live.previewUrl;
  const [artFade, setArtFade] = useState(0);
  const fadedOutRef = useRef(false);
  const volumeRef = useRef(VOLUME);
  const { isPlaying, play, pause, fade, getPosition, duration, setVolume } =
    usePreview(previewUrl, () => {
      setArtFade(0);
      setPreview(null);
    });

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const interval = setInterval(() => {
      const total = duration || 30;
      const position = getPosition();
      setArtFade(Math.min(1, position / total));
      if (total - position < 6 && !fadedOutRef.current) {
        fadedOutRef.current = true;
        fade(volumeRef.current, 0, 5500);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, duration, getPosition, fade]);

  useEffect(() => {
    if (!(isPlaying && track)) {
      return;
    }
    const previous = document.title;
    document.title = `♫ ${track.name} · ${track.artist}`;
    return () => {
      document.title = previous;
    };
  }, [isPlaying, track]);

  const togglePreview = useCallback(() => {
    if (preview) {
      pause();
      setArtFade(0);
      setPreview(null);
      return;
    }
    if (!(live.track && live.previewUrl)) {
      return;
    }
    fadedOutRef.current = false;
    volumeRef.current = isTouch() ? VOLUME_TOUCH : VOLUME;
    setArtFade(0);
    setPreview({ track: live.track, url: live.previewUrl });
    setVolume(0);
    play();
    fade(0, volumeRef.current, 2000);
  }, [preview, live.track, live.previewUrl, pause, play, setVolume, fade]);

  const albumArt =
    track?.image.find((image) => image.size === "large")?.["#text"] ??
    track?.image.find((image) => image.size === "medium")?.["#text"] ??
    null;

  const mode =
    room === "listening" && track
      ? "art"
      : word && !room
        ? MODES[word]
        : preview
          ? "art"
          : SCULPTURES[sculpture].mode;

  const caption = (() => {
    if (word === "music" || (!word && preview)) {
      if (preview) {
        return "( humming along )";
      }
      if (albumArt) {
        return previewUrl
          ? "( dressed as the cover, press play )"
          : "( dressed as the album cover )";
      }
      return CAPTIONS.music;
    }
    return word ? CAPTIONS[word] : SCULPTURES[sculpture].caption;
  })();

  return (
    <main className="living-room fixed inset-0 overflow-hidden paper paper-lit font-serif-display text-ink selection:bg-rose selection:text-paper">
      <div className="home-signature">
        <button onClick={() => openRoom("about")} type="button">
          {identity.domain}
          <span aria-hidden="true">✳</span>
        </button>
        <span>a place for things</span>
      </div>
      <div className="living-composition">
        <div className="sentence-root living-sentence">
          <p className="living-eyebrow rise">
            software, security, and side quests.
          </p>
          <TheSentence
            className="living-introduction"
            hostname={hostname}
            onPreviewToggle={previewUrl ? togglePreview : undefined}
            onWordHover={setWord}
            onExplore={exploreWord}
            previewPlaying={preview !== null}
            track={track}
            wordStagger
          />
          <p className="living-invitation rise">
            <span className="hint-desktop">
              hover to peek. click to stay a little.
            </span>
            <span className="hint-touch">
              the words are little doors. tap one.
            </span>
          </p>
        </div>

        <div className="living-art rise" style={{ animationDelay: "200ms" }}>
          <div className="living-rose-stage">
            <span className="rose-halo" aria-hidden="true" />
            <ParticleRose
              artFade={artFade}
              artUrl={albumArt}
              className="living-rose"
              mode={mode}
              paused={room !== null && room !== "listening"}
            />
            <p aria-hidden="true" className="rose-caption">
              <span className="swap-in" key={caption}>
                {caption}
              </span>
            </p>
            <div
              className="rose-shapes"
              role="group"
              aria-label="Play with the rose"
            >
              {SCULPTURES.map((item, index) => (
                <button
                  aria-label={`Shape: ${item.label}`}
                  aria-pressed={sculpture === index}
                  key={item.mode}
                  onClick={() => {
                    setSculpture(index);
                    sfx("tick");
                  }}
                  type="button"
                >
                  <span aria-hidden="true">{["✳", "◇", "⁙", "◎"][index]}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="living-footer">
        <span className="living-footer-note">
          made of code & a little curiosity
        </span>
        <nav aria-label="Explore this space" className="home-dock">
          {ROOMS.map((item) => (
            <button
              aria-label={`Open ${item.label}`}
              key={item.id}
              onClick={() => openRoom(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.glyph}</span>
              <span>{item.short}</span>
            </button>
          ))}
        </nav>
        <button
          className="index-shortcut"
          onClick={() => openRoom("index")}
          type="button"
        >
          take a look around <kbd>⌘ K</kbd>
        </button>
      </footer>
      <RoomDialog
        hostname={hostname}
        onClose={closeRoom}
        onOpen={openRoom}
        onPreview={previewUrl ? togglePreview : undefined}
        playing={isPlaying}
        progress={artFade}
        room={room}
        track={track}
      />
      <TintStrips />
    </main>
  );
}
