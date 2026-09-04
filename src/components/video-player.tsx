import { type PointerEvent, useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

type State = "idle" | "playing" | "paused" | "ended";

const SEEK_STEP_S = 5;
const AWAKE_MS = 1100;
const FLASH_MS = 550;

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
      {name === "pause" ? (
        <path d="M3.4 2v8M8.6 2v8" strokeWidth="2.2" />
      ) : null}
      {name === "expand" ? (
        <path d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3" />
      ) : null}
    </svg>
  );
}

// silent screen recordings. the picture is the play/pause surface with one
// cue on it: play when stopped, pause while the pointer is awake over it.
// touch has no hover, so it gets a strip button instead and a flash on tap.
// no volume: nothing to hear
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
  const awakeTimer = useRef(0);
  const flashTimer = useRef(0);
  const [state, setState] = useState<State>("idle");
  const [buffering, setBuffering] = useState(false);
  const [awake, setAwake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(knownDuration);

  useEffect(
    () => () => {
      clearTimeout(awakeTimer.current);
      clearTimeout(flashTimer.current);
    },
    []
  );

  const toggle = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused || video.ended) {
      video.play().catch(() => undefined);
      sfx("play");
      if (window.matchMedia("(hover: none)").matches) {
        setFlash(true);
        clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), FLASH_MS);
      }
    } else {
      video.pause();
      sfx("pause");
    }
  };

  const wake = () => {
    setAwake(true);
    clearTimeout(awakeTimer.current);
    awakeTimer.current = window.setTimeout(() => setAwake(false), AWAKE_MS);
  };

  const sleep = () => {
    clearTimeout(awakeTimer.current);
    setAwake(false);
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
  const cueVisible = !playing || awake;

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
      <div className="player-stage" onPointerLeave={sleep} onPointerMove={wake}>
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
        <button
          aria-label={playing ? "pause" : "play"}
          className="player-cue"
          data-visible={cueVisible ? "" : undefined}
          onClick={toggle}
          tabIndex={cueVisible ? undefined : -1}
          type="button"
        >
          {state === "ended" ? (
            "( again )"
          ) : (
            <Icon name={playing ? "pause" : "play"} />
          )}
        </button>
        {flash ? (
          <span aria-hidden="true" className="player-cue player-flash">
            <Icon name="play" />
          </span>
        ) : null}
        {buffering && playing ? (
          <span aria-live="polite" className="player-note">
            ( loading )
          </span>
        ) : null}
      </div>

      <div className="player-bar">
        {state === "playing" || state === "paused" ? (
          <button
            aria-label={playing ? "pause" : "play"}
            className="player-btn player-toggle"
            onClick={toggle}
            type="button"
          >
            <Icon name={playing ? "pause" : "play"} />
          </button>
        ) : null}
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
