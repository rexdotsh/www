import { type PointerEvent, useEffect, useRef, useState } from "react";

type State = "idle" | "playing" | "paused" | "ended";

const SEEK_STEP_S = 5;

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

function Icon({ name }: { name: "play" | "pause" | "expand" }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 12 12"
      width="12"
    >
      {name === "play" ? (
        <path d="M3 1.8v8.4L10 6z" fill="currentColor" stroke="none" />
      ) : null}
      {name === "pause" ? <path d="M3.5 2v8M8.5 2v8" /> : null}
      {name === "expand" ? (
        <path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
      ) : null}
    </svg>
  );
}

// silent screen recordings: a poster, one big play, a rail, a clock, fullscreen.
// no volume, because there is nothing to hear
export default function VideoPlayer({
  poster,
  src,
}: {
  poster?: string;
  src: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("idle");
  const [buffering, setBuffering] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused || video.ended) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const seekBy = (delta: number) => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(
        video.duration,
        Math.max(0, video.currentTime + delta)
      );
    }
  };

  const seekTo = (fraction: number) => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(1, Math.max(0, fraction)) * video.duration;
      frameRef.current?.style.setProperty("--progress", `${fraction}`);
    }
  };

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width);
  };

  const fullscreen = () => {
    const frame = frameRef.current;
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (frame?.requestFullscreen) {
      frame.requestFullscreen();
    } else {
      // ios only offers the native fullscreen player
      video?.webkitEnterFullscreen?.();
    }
  };

  // the rail is written straight to a css var while playing, no re-renders
  useEffect(() => {
    if (state !== "playing") {
      return;
    }
    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video && video.duration > 0) {
        frameRef.current?.style.setProperty(
          "--progress",
          `${video.currentTime / video.duration}`
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // while any control has focus. space and enter are left to the buttons
  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "k":
        toggle();
        break;
      case "f":
        fullscreen();
        break;
      case "ArrowLeft":
        seekBy(-SEEK_STEP_S);
        break;
      case "ArrowRight":
        seekBy(SEEK_STEP_S);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const playing = state === "playing";
  const showClock = duration > 0;

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: shortcuts for whichever control has focus
    <div
      aria-label="video"
      className="player post-media"
      data-buffering={buffering ? "" : undefined}
      data-state={state}
      onKeyDown={onKeyDown}
      ref={frameRef}
      role="group"
    >
      <div className="player-stage">
        {/* biome-ignore lint/a11y/useMediaCaption: silent screen recordings */}
        <video
          className="player-video"
          onClick={toggle}
          onDurationChange={(event) =>
            setDuration(event.currentTarget.duration)
          }
          onEnded={() => setState("ended")}
          onPause={() =>
            setState((prev) => (prev === "ended" ? prev : "paused"))
          }
          onPlay={() => setState("playing")}
          onPlaying={() => setBuffering(false)}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onWaiting={() => setBuffering(true)}
          playsInline
          poster={poster}
          preload="none"
          ref={videoRef}
          src={src}
        />
        {state === "idle" || state === "ended" ? (
          <button
            aria-label={state === "ended" ? "play again" : "play"}
            className="player-cue"
            onClick={toggle}
            type="button"
          >
            {state === "ended" ? "( again )" : <Icon name="play" />}
          </button>
        ) : null}
        {buffering && playing ? (
          <span aria-live="polite" className="player-note">
            ( loading )
          </span>
        ) : null}
      </div>

      <div className="player-bar">
        <button
          aria-label={playing ? "pause" : "play"}
          className="player-btn"
          onClick={toggle}
          type="button"
        >
          <Icon name={playing ? "pause" : "play"} />
        </button>
        {showClock ? (
          <span className="player-clock">
            {clock(current)}
            <span className="player-clock-total"> / {clock(duration)}</span>
          </span>
        ) : null}
        <div
          aria-label="seek"
          aria-valuemax={duration}
          aria-valuemin={0}
          aria-valuenow={current}
          className="player-rail"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            scrub(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              scrub(event);
            }
          }}
          role="slider"
          tabIndex={-1}
        >
          <span className="player-fill" />
        </div>
        <button
          aria-label="fullscreen"
          className="player-btn"
          onClick={fullscreen}
          type="button"
        >
          <Icon name="expand" />
        </button>
      </div>
    </div>
  );
}
