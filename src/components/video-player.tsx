import { type PointerEvent, useEffect, useRef, useState } from "react";

type State = "idle" | "playing" | "paused" | "ended";

const SEEK_STEP_S = 5;

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

function Icon({ name }: { name: "play" | "expand" }) {
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
      ) : (
        <path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
      )}
    </svg>
  );
}

// silent screen recordings. the picture is the play/pause surface, one cue
// sits on it whenever it is not playing, and the strip beneath holds the
// clock, a rail you can scrub, and fullscreen. no volume: nothing to hear
export default function VideoPlayer({
  duration: knownDuration = 0,
  poster,
  src,
}: {
  duration?: number;
  poster?: string;
  src: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("idle");
  const [buffering, setBuffering] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(knownDuration);

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

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      const clamped = Math.min(video.duration, Math.max(0, seconds));
      video.currentTime = clamped;
      setCurrent(clamped);
      frameRef.current?.style.setProperty(
        "--progress",
        `${clamped / video.duration}`
      );
    }
  };

  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    seekTo(fraction * (videoRef.current?.duration ?? 0));
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
    const video = videoRef.current;
    switch (event.key) {
      case "k":
        toggle();
        break;
      case "f":
        fullscreen();
        break;
      case "ArrowLeft":
        seekTo((video?.currentTime ?? 0) - SEEK_STEP_S);
        break;
      case "ArrowRight":
        seekTo((video?.currentTime ?? 0) + SEEK_STEP_S);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const playing = state === "playing";

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: shortcuts for whichever control has focus
    <div
      aria-label="video"
      className="player post-media"
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
        {playing ? null : (
          <button
            aria-label={state === "ended" ? "play again" : "play"}
            className="player-cue"
            onClick={toggle}
            type="button"
          >
            {state === "ended" ? "( again )" : <Icon name="play" />}
          </button>
        )}
        {buffering && playing ? (
          <span aria-live="polite" className="player-note">
            ( loading )
          </span>
        ) : null}
      </div>

      <div className="player-bar">
        <span className="player-clock">
          {clock(current)}
          {duration > 0 ? (
            <span className="player-clock-total"> / {clock(duration)}</span>
          ) : null}
        </span>
        <div
          aria-label="seek"
          aria-valuemax={duration}
          aria-valuemin={0}
          aria-valuenow={current}
          className="player-rail"
          onPointerDown={(event) => {
            scrub(event);
            event.currentTarget.setPointerCapture(event.pointerId);
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
