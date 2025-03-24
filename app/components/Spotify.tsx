"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface SpotifyTrackData {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number }>;
  };
  external_urls: {
    spotify: string;
  };
  id: string;
}

interface SpotifyTrack {
  isPlaying: boolean;
  name: string;
  artist: string;
  album: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large";
  }>;
  url: string;
  id: string;
}

const SPOTIFY_API = {
  NOW_PLAYING: "https://api.spotify.com/v1/me/player/currently-playing",
  RECENTLY_PLAYED: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
  TOKEN: "https://accounts.spotify.com/api/token",
} as const;

const transformTrackData = (data: SpotifyTrackData, isPlaying = false): SpotifyTrack => ({
  isPlaying,
  name: data.name,
  artist: data.artists.map((artist) => artist.name).join(", "),
  album: data.album.name,
  image: data.album.images.map((img) => ({
    "#text": img.url,
    size: img.height <= 64 ? "small" : img.height <= 300 ? "medium" : "large",
  })),
  url: data.external_urls.spotify,
  id: data.id,
});

const SpotifyNowPlaying = () => {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const getAccessToken = useCallback(
    async (force = false) => {
      if (!force && accessToken && Date.now() < tokenExpiry) {
        return accessToken;
      }

      try {
        const response = await fetch("/api/spotify/token");
        if (!response.ok) throw new Error("Failed to fetch token");

        const data = await response.json();
        if (!data.access_token) throw new Error("Invalid token response");

        setAccessToken(data.access_token);
        setTokenExpiry(Date.now() + (data.expires_in - 60) * 1000);

        return data.access_token;
      } catch (err) {
        console.error("Failed to get access token:", err);
        return null;
      }
    },
    [accessToken, tokenExpiry]
  );

  const fetchRecentlyPlayed = useCallback(async (token: string) => {
    try {
      const response = await fetch(SPOTIFY_API.RECENTLY_PLAYED, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch recently played");
      const data = await response.json();
      return data.items?.[0] ? transformTrackData(data.items[0].track) : null;
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
      return null;
    }
  }, []);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Failed to get access token");

      const response = await fetch(SPOTIFY_API.NOW_PLAYING, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 204) {
        const recentTrack = await fetchRecentlyPlayed(token);
        setTrack(recentTrack);
        return;
      }

      if (response.status === 401) {
        const newToken = await getAccessToken(true);
        if (!newToken) throw new Error("Failed to refresh token");

        const retryResponse = await fetch(SPOTIFY_API.NOW_PLAYING, {
          headers: { Authorization: `Bearer ${newToken}` },
        });

        if (retryResponse.status === 204) {
          const recentTrack = await fetchRecentlyPlayed(newToken);
          setTrack(recentTrack);
          return;
        }

        if (!retryResponse.ok) throw new Error("Failed to fetch now playing after token refresh");
        const data = await retryResponse.json();
        if (!data.item) {
          setTrack(null);
          return;
        }
        setTrack(transformTrackData(data.item, data.is_playing));
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch now playing");
      const data = await response.json();
      if (!data.item) {
        setTrack(null);
        return;
      }

      setTrack(transformTrackData(data.item, data.is_playing));
      setError(null);
    } catch (err) {
      setError("Failed to load track data");
      console.error(err);

      retryTimeoutRef.current = setTimeout(fetchNowPlaying, 30000);
    }
  }, [getAccessToken, fetchRecentlyPlayed]);

  const getAlbumArt = useCallback(() => {
    const images = track?.image || [];
    return images.find((img) => img.size === "medium")?.["#text"] || "";
  }, [track]);

  const fetchPreviewUrl = useCallback(async (trackId: string) => {
    try {
      const response = await fetch(`/api/spotify/preview/${trackId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch preview URL");
      }

      return data.url;
    } catch (err) {
      console.error("Failed to fetch preview URL:", err);
      return null;
    }
  }, []);

  const handlePlayPreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!track) return;

    try {
      if (!previewUrl) {
        const url = await fetchPreviewUrl(track.id);
        if (!url) {
          console.error("No preview URL available");
          return;
        }
        setPreviewUrl(url);
        if (!audioRef.current) {
          const audio = new Audio(url);
          audio.volume = 0;

          const handleEnded = () => setIsPlaying(false);
          const handleError = (e: ErrorEvent) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
          };

          audio.addEventListener("ended", handleEnded);
          audio.addEventListener("error", handleError);

          audioRef.current = audio;
          await fadeAudioVolume(audio, 0, 0.2);
        }
      } else if (!audioRef.current) {
        const audio = new Audio(previewUrl);
        audio.volume = 0;

        const handleEnded = () => setIsPlaying(false);
        const handleError = (e: ErrorEvent) => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        audioRef.current = audio;
        await fadeAudioVolume(audio, 0, 0.2);
      }

      if (isPlaying && audioRef.current) {
        await fadeAudioVolume(audioRef.current, audioRef.current.volume, 0);
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.2;
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (playError) {
          console.error("Failed to play audio:", playError);
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("Error in handlePlayPreview:", error);
      setIsPlaying(false);
    }
  };

  const fadeAudioVolume = (audio: HTMLAudioElement, start: number, end: number) => {
    return new Promise<void>((resolve) => {
      const step = start < end ? 0.02 : -0.04;
      const interval = setInterval(() => {
        const newVolume = audio.volume + step;

        if ((step > 0 && newVolume >= end) || (step < 0 && newVolume <= end)) {
          audio.volume = end;
          clearInterval(interval);
          resolve();
        } else {
          audio.volume = newVolume;
        }
      }, 150);
    });
  };

  const checkVisibility = useCallback(() => {
    const minHeightForSpotify = 900;
    const isMobileScreen = window.innerWidth < 768;
    setShouldShow(isMobileScreen || window.innerHeight >= minHeightForSpotify);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    checkVisibility();
    window.addEventListener("resize", checkVisibility);

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);

    return () => {
      window.removeEventListener("resize", checkVisibility);
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [checkVisibility, fetchNowPlaying]);

  if (!track || !shouldShow) return null;

  return (
    <div className="fixed bottom-20 md:bottom-32 w-full px-6">
      <div className="max-w-sm mx-auto">
        {error ? null : track ? (
          <div className="relative">
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-4 bg-neutral-900/50 backdrop-blur-sm p-4 
                      rounded-lg border border-neutral-800 hover:border-neutral-700 
                      transition-all duration-300 pr-16
                      ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
              <div className="relative min-w-16 h-16">
                <Image src={getAlbumArt()} alt={`${track.album} album art`} className="rounded-md object-cover" width={64} height={64} onLoad={() => setTimeout(() => setIsVisible(true), 1)} />
                {track.isPlaying && isVisible && (
                  <div className="absolute -bottom-2 -right-2 flex items-end gap-[2px] bg-neutral-900/90 p-1.5 rounded-md">
                    <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-1" />
                    <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-2" />
                    <div className="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-3" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1 mr-2">
                <span className="text-xs text-rose-400/80 mb-0.5">{track.isPlaying ? "currently listening to" : "last played"}</span>
                <span className="font-medium text-neutral-200 truncate group-hover:text-rose-400/80 transition-colors">{track.name}</span>
                <span className="text-neutral-400 text-sm truncate">{track.artist}</span>
                <span className="text-neutral-500 text-sm truncate">{track.album}</span>
              </div>
            </a>
            <button
              type="button"
              onClick={handlePlayPreview}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400/80 
                       transition-colors duration-300
                       ${isVisible ? "animate-fade-in" : "opacity-0"}`}
              title={isPlaying ? "Pause Preview" : "Play Preview"}
              aria-label={isPlaying ? "Pause song preview" : "Play song preview"}>
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true" role="img">
                  <path
                    fillRule="evenodd"
                    d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true" role="img">
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SpotifyNowPlaying;
