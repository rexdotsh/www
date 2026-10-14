import { useCallback, useEffect, useRef, useState } from "react";
import type { NowPlaying } from "@/lib/spotify";
import { isTouch } from "@/lib/utils";

const FADE_STEP_MS = 30;
const VOLUME = 0.5;
const VOLUME_TOUCH = 0.28;

// Route preview volume through one shared gain context on iOS.
let context: AudioContext | null = null;

const getContext = () => {
  if (typeof AudioContext === "undefined") {
    return null;
  }
  context ??= new AudioContext();
  return context;
};

interface Graph {
  gain: GainNode;
  source: MediaElementAudioSourceNode;
}

interface Preview {
  track: NowPlaying;
  url: string;
}

const clamp = (level: number) => Math.min(1, Math.max(0, level));

// While a preview plays, its track stays put even if the next poll moves on.
export function usePreview(live: {
  previewUrl: string | null;
  track: NowPlaying | null;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const track = preview?.track ?? live.track;
  const url = preview?.url ?? live.previewUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const plainRef = useRef(false);
  const levelRef = useRef(0);
  const fadeRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const artFadeRef = useRef(0);
  const fadedOutRef = useRef(false);
  const volumeRef = useRef(VOLUME);
  const [isPlaying, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const end = useCallback(() => {
    artFadeRef.current = 0;
    setPreview(null);
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    // Most visitors never press play; `warm` starts buffering on intent.
    audio.preload = "none";
    audio.volume = 0;
    audio.src = url;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    // Retry without CORS if the gain graph cannot read the media.
    const onError = () => {
      if (plainRef.current || graphRef.current) {
        end();
        return;
      }
      plainRef.current = true;
      audio.crossOrigin = null;
      audio.src = url;
      audio.load();
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", end);
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("error", onError);
    audioRef.current = audio;
    plainRef.current = false;
    levelRef.current = 0;
    setPlaying(false);
    setDuration(0);
    return () => {
      clearInterval(fadeRef.current);
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", end);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("error", onError);
      graphRef.current?.source.disconnect();
      graphRef.current?.gain.disconnect();
      graphRef.current = null;
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [url, end]);

  const applyLevel = useCallback((level: number) => {
    const next = clamp(level);
    levelRef.current = next;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const graph = graphRef.current;
    if (graph) {
      graph.gain.gain.value = next;
      audio.volume = 1;
    } else {
      audio.volume = next;
    }
  }, []);

  const fade = useCallback(
    (from: number, to: number, ms: number) => {
      if (!audioRef.current) {
        return;
      }
      clearInterval(fadeRef.current);
      const startedAt = performance.now();
      applyLevel(from);
      fadeRef.current = setInterval(() => {
        const u = Math.min(1, (performance.now() - startedAt) / ms);
        applyLevel(from + (to - from) * u);
        if (u >= 1) {
          clearInterval(fadeRef.current);
        }
      }, FADE_STEP_MS);
    },
    [applyLevel]
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (!(graphRef.current || plainRef.current)) {
      const ctx = getContext();
      if (ctx) {
        try {
          const source = ctx.createMediaElementSource(audio);
          const gain = ctx.createGain();
          gain.gain.value = levelRef.current;
          source.connect(gain);
          gain.connect(ctx.destination);
          graphRef.current = { gain, source };
          audio.volume = 1;
        } catch {
          // Keep native playback if graph setup fails.
        }
      }
    }
    if (graphRef.current && context?.state !== "running") {
      context?.resume().catch(() => undefined);
    }
    audio.play().catch(end);
  }, [end]);

  const warm = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.preload = "auto";
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const interval = setInterval(() => {
      const total = duration || 30;
      const position = audioRef.current?.currentTime ?? 0;
      artFadeRef.current = Math.min(1, position / total);
      if (total - position < 6 && !fadedOutRef.current) {
        fadedOutRef.current = true;
        fade(volumeRef.current, 0, 5500);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, duration, fade]);

  useEffect(() => {
    if (!(isPlaying && track)) {
      return;
    }
    const previous = document.title;
    const playing = `♫ ${track.name} · ${track.artist}`;
    document.title = playing;
    return () => {
      if (document.title === playing) {
        document.title = previous;
      }
    };
  }, [isPlaying, track]);

  const toggle = useCallback(() => {
    if (preview) {
      clearInterval(fadeRef.current);
      audioRef.current?.pause();
      end();
      return;
    }
    if (!(live.track && live.previewUrl)) {
      return;
    }
    fadedOutRef.current = false;
    volumeRef.current = isTouch() ? VOLUME_TOUCH : VOLUME;
    artFadeRef.current = 0;
    setPreview({ track: live.track, url: live.previewUrl });
    clearInterval(fadeRef.current);
    applyLevel(0);
    play();
    fade(0, volumeRef.current, 2000);
  }, [preview, live.track, live.previewUrl, end, applyLevel, play, fade]);

  return {
    artFadeRef,
    previewing: preview !== null,
    previewUrl: url,
    toggle,
    track,
    warm,
  };
}
