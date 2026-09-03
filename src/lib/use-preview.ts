import { useCallback, useEffect, useRef, useState } from "react";

// a fade is walked by hand: the element knows a volume, not a ramp. timed
// from the clock so a throttled tab still lands on the right value
const FADE_STEP_MS = 30;

// the thirty-second preview, played through a plain audio element. nothing
// here needs web audio, so no context is ever created for it
export function usePreview(url: string | null, onEnd: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    audio.preload = "auto";
    audio.volume = 0;
    audio.src = url;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => onEndRef.current();
    const onMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onMetadata);
    audioRef.current = audio;
    setPlaying(false);
    setDuration(0);
    return () => {
      clearInterval(fadeRef.current);
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [url]);

  const setVolume = useCallback((volume: number) => {
    clearInterval(fadeRef.current);
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
    }
  }, []);

  const fade = useCallback((from: number, to: number, ms: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    clearInterval(fadeRef.current);
    const startedAt = performance.now();
    audio.volume = from;
    fadeRef.current = setInterval(() => {
      const u = Math.min(1, (performance.now() - startedAt) / ms);
      audio.volume = from + (to - from) * u;
      if (u >= 1) {
        clearInterval(fadeRef.current);
      }
    }, FADE_STEP_MS);
  }, []);

  const play = useCallback(() => {
    // refused when the browser wants a gesture it did not get; the tap that
    // asked is the gesture, so this only trips in odd corners
    audioRef.current?.play().catch(() => undefined);
  }, []);

  const pause = useCallback(() => {
    clearInterval(fadeRef.current);
    audioRef.current?.pause();
  }, []);

  const getPosition = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  return { duration, fade, getPosition, isPlaying, pause, play, setVolume };
}
