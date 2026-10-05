import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Icon from "@/components/icon";
import { sfx } from "@/lib/sfx";
import { isTouch } from "@/lib/utils";

type State = "idle" | "playing" | "paused" | "ended";

const SEEK_STEP_S = 5;
const AWAKE_MS = 1100;
const FLASH_MS = 550;

const clock = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

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
  const [near, setNear] = useState(false);

  useEffect(
    () => () => {
      clearTimeout(awakeTimer.current);
      clearTimeout(flashTimer.current);
    },
    []
  );

  // A poster can't be lazy-loaded, so only set it once the player is close.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused || video.ended) {
      video.play().catch(() => undefined);
      sfx("play");
      if (isTouch()) {
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
      video?.webkitEnterFullscreen?.();
    }
  };

  // Update progress without React renders.
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

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
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
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: keyboard shortcuts
    <div
      aria-label="video"
      className="player post-media"
      data-state={state}
      onKeyDown={onKeyDown}
      ref={frameRef}
      role="group"
    >
      <div className="player-stage" onPointerLeave={sleep} onPointerMove={wake}>
        {/* biome-ignore lint/a11y/useMediaCaption: silent video */}
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
          poster={near ? poster : undefined}
          preload="none"
          ref={videoRef}
          src={src}
        />
        <button
          aria-label={playing ? "pause" : "play"}
          className="player-cue"
          data-visible={cueVisible ? "" : undefined}
          onClick={toggle}
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
          aria-valuetext={`${clock(current)} of ${clock(duration)}`}
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
          tabIndex={0}
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
