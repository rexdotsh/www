import { useCallback, useEffect, useRef, useState } from "react";

const FADE_STEP_MS = 30;

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

const clamp = (level: number) => Math.min(1, Math.max(0, level));

export function usePreview(url: string | null, onEnd: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const plainRef = useRef(false);
  const levelRef = useRef(0);
  const fadeRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [isPlaying, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!url) {
      return;
    }
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = 0;
    audio.src = url;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => onEndRef.current();
    const onMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    // Retry without CORS if the gain graph cannot read the media.
    const onError = () => {
      if (plainRef.current || graphRef.current) {
        onEndRef.current();
        return;
      }
      plainRef.current = true;
      audio.crossOrigin = null;
      audio.src = url;
      audio.load();
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
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
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("error", onError);
      graphRef.current?.source.disconnect();
      graphRef.current?.gain.disconnect();
      graphRef.current = null;
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [url]);

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

  const setVolume = useCallback(
    (volume: number) => {
      clearInterval(fadeRef.current);
      applyLevel(volume);
    },
    [applyLevel]
  );

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
    audio.play().catch(() => onEndRef.current());
  }, []);

  const pause = useCallback(() => {
    clearInterval(fadeRef.current);
    audioRef.current?.pause();
  }, []);

  const getPosition = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  return { duration, fade, getPosition, isPlaying, pause, play, setVolume };
}
