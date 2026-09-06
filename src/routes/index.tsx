import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import ParticleRose, { type RoseMode } from "@/components/particle-rose";
import { TheSentence, type SentenceWord } from "@/components/the-sentence";
import TintStrips from "@/components/tint-strips";
import PortfolioSections from "@/components/portfolio-sections";
import { getIdentity, LINKS } from "@/lib/content";
import { type SpotifyTrack, useNowPlaying } from "@/lib/use-now-playing";
import { usePreview } from "@/lib/use-preview";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
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

const SPECIMENS = [
  { mode: "rest", label: "rose", note: "a little controlled chaos" },
  { mode: "cube", label: "structure", note: "everything in its right place" },
  { mode: "garden", label: "garden", note: "room for something to grow" },
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
  const [specimen, setSpecimen] = useState<(typeof SPECIMENS)[number]>(
    SPECIMENS[0]
  );
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

  const mode = word ? MODES[word] : preview ? "art" : specimen.mode;

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
    return word ? CAPTIONS[word] : specimen.note;
  })();

  return (
    <div
      className="portfolio paper paper-lit text-ink selection:bg-rose selection:text-paper"
      id="top"
    >
      <a className="skip-link" href="#main">
        skip to content
      </a>
      <header className="masthead portfolio-width">
        <a
          aria-label={`${identity.name}, home`}
          className="wordmark"
          href="#top"
        >
          {identity.name}
          <span aria-hidden="true">✳</span>
        </a>
        <span className="masthead-note">a personal corner of the internet</span>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#work">
            work <span>01</span>
          </a>
          <Link to="/blog">
            writing <span>02</span>
          </Link>
          <a href="#contact">
            say hi <span>↗</span>
          </a>
        </nav>
      </header>

      <main className="portfolio-width" id="main">
        <section aria-labelledby="intro-title" className="home-hero">
          <div className="hero-copy rise">
            <p className="eyebrow">
              <span className="status-dot" /> code / curiosity / other things
            </p>
            <h1 id="intro-title">
              A work in
              <br />
              <em>progress.</em>
              <span className="hero-asterisk" aria-hidden="true">
                *
              </span>
            </h1>
            <div className="sentence-root hero-intro">
              <TheSentence
                className="intro-sentence"
                hostname={hostname}
                onPreviewToggle={previewUrl ? togglePreview : undefined}
                onWordHover={setWord}
                previewPlaying={preview !== null}
                track={track}
              />
            </div>
            <a className="text-link hero-link" href="#work">
              explore the work <span aria-hidden="true">↓</span>
            </a>
          </div>
          <figure className="specimen rise" style={{ animationDelay: "160ms" }}>
            <div className="specimen-header eyebrow">
              <span>fig. 001 — living pixels</span>
              <span aria-hidden="true">+ +</span>
            </div>
            <div className="specimen-stage">
              <span aria-hidden="true" className="specimen-orbit" />
              <ParticleRose
                artFade={artFade}
                artUrl={albumArt}
                className="specimen-rose"
                mode={mode}
              />
              <span className="specimen-axis" aria-hidden="true">
                x / y / a little entropy
              </span>
            </div>
            <figcaption>
              <p className="specimen-caption">
                <span className="swap-in" key={caption}>
                  {caption}
                </span>
              </p>
              <div
                aria-label="Particle shape"
                className="specimen-controls"
                role="group"
              >
                {SPECIMENS.map((item, index) => (
                  <button
                    aria-pressed={specimen.mode === item.mode}
                    key={item.mode}
                    onClick={() => setSpecimen(item)}
                    type="button"
                  >
                    <span>0{index + 1}</span> {item.label}
                  </button>
                ))}
              </div>
              <p className="specimen-hint">
                move a little closer. it responds.
              </p>
            </figcaption>
          </figure>
        </section>
        <PortfolioSections />
        <footer className="home-footer" id="contact">
          <div className="footer-invitation">
            <p className="eyebrow">03 / leave a little hello</p>
            <a href={LINKS.twitter} rel="noopener noreferrer" target="_blank">
              Good things start
              <br />
              with <em>a conversation.</em>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="footer-bottom">
            <span>
              {identity.domain}{" "}
              <span className="footer-star" aria-hidden="true">
                ✳
              </span>{" "}
              always in progress
            </span>
            <div>
              <a href={LINKS.github} rel="noopener noreferrer" target="_blank">
                github ↗
              </a>
              <a href={LINKS.twitter} rel="noopener noreferrer" target="_blank">
                x / twitter ↗
              </a>
              <a href="#top">back to top ↑</a>
            </div>
          </div>
        </footer>
      </main>
      <TintStrips />
    </div>
  );
}
