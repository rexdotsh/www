import {Component, createEffect, createSignal, onCleanup} from "solid-js";
import type {SpotifyTrack} from "../../lib/spotify";

const SPOTIFY_API = {
  NOW_PLAYING: "https://api.spotify.com/v1/me/player/currently-playing",
  RECENTLY_PLAYED: "https://api.spotify.com/v1/me/player/recently-played?limit=1",
  TOKEN: "https://accounts.spotify.com/api/token",
} as const;

const transformTrackData = (data: any, isPlaying = false): SpotifyTrack => ({
  isPlaying,
  name: data.name,
  artist: data.artists.map((artist: any) => artist.name).join(", "),
  album: data.album.name,
  image: data.album.images.map((img: any) => ({
    "#text": img.url,
    size: img.height <= 64 ? "small" : img.height <= 300 ? "medium" : "large",
  })),
  url: data.external_urls.spotify,
  id: data.id,
});

const SpotifyNowPlaying: Component = () => {
  const [track, setTrack] = createSignal<SpotifyTrack | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [isVisible, setIsVisible] = createSignal(false);
  const [accessToken, setAccessToken] = createSignal<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = createSignal<number>(0);
  const [previewUrl, setPreviewUrl] = createSignal<string | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const audioRef = {current: null as HTMLAudioElement | null};

  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN;

  const getAccessToken = async (force = false) => {
    if (!force && accessToken() && Date.now() < tokenExpiry()) {
      return accessToken();
    }

    try {
      const response = await fetch(SPOTIFY_API.TOKEN, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
      });
      const data = await response.json();

      setAccessToken(data.access_token);
      setTokenExpiry(Date.now() + (data.expires_in - 60) * 1000);

      return data.access_token;
    } catch (err) {
      console.error("Failed to get access token:", err);
      return null;
    }
  };

  const fetchRecentlyPlayed = async (token: string) => {
    try {
      const response = await fetch(SPOTIFY_API.RECENTLY_PLAYED, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = await response.json();
      return data.items?.[0] ? transformTrackData(data.items[0].track) : null;
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
      return null;
    }
  };

  const fetchNowPlaying = async () => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Failed to get access token");

      const response = await fetch(SPOTIFY_API.NOW_PLAYING, {
        headers: {Authorization: `Bearer ${token}`},
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
          headers: {Authorization: `Bearer ${newToken}`},
        });

        if (retryResponse.status === 204) {
          const recentTrack = await fetchRecentlyPlayed(newToken);
          setTrack(recentTrack);
          return;
        }

        const data = await retryResponse.json();
        if (!data.item) {
          setTrack(null);
          return;
        }
        setTrack(transformTrackData(data.item, data.is_playing));
        return;
      }

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
    }
  };

  createEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 60000);
    onCleanup(() => clearInterval(interval));
  });

  const getAlbumArt = () => {
    const images = track()?.image || [];
    return images.find((img) => img.size === "medium")?.["#text"] || "";
  };

  const fetchPreviewUrl = async (trackId: string) => {
    try {
      const response = await fetch(`/api/spotifyPreview/${trackId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch preview URL");
      }

      return data.url;
    } catch (err) {
      console.error("Failed to fetch preview URL:", err);
      return null;
    }
  };

  const handlePlayPreview = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!track()) return;

    try {
      if (!previewUrl()) {
        const url = await fetchPreviewUrl(track()!.id);
        if (!url) {
          console.error("No preview URL available");
          return;
        }
        setPreviewUrl(url);
      }

      if (!audioRef.current) {
        const initializeAudio = () => {
          const audio = new Audio(previewUrl()!);
          audio.volume = 0;

          audio.addEventListener("ended", () => setIsPlaying(false));
          audio.addEventListener("error", (e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
          });

          return audio;
        };

        audioRef.current = initializeAudio();
        fadeAudioVolume(audioRef.current, 0, 0.2); // fade in
      }

      if (isPlaying()) {
        await fadeAudioVolume(audioRef.current, audioRef.current.volume, 0);
        audioRef.current.pause();
        audioRef.current.volume = 0.2;
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
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

  onCleanup(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  });

  return (
    <div class="fixed bottom-24 md:bottom-32 w-full px-6">
      <div class="max-w-sm mx-auto">
        {error() ? null : track() ? (
          <div class="relative">
            <a
              href={track()?.url}
              target="_blank"
              rel="noopener noreferrer"
              class={`group flex items-center gap-4 bg-neutral-900/50 backdrop-blur-sm p-4 
                    rounded-lg border border-neutral-800 hover:border-neutral-700 
                    transition-all duration-300 pr-16
                    ${isVisible() ? "animate-fade-in" : "opacity-0"}`}>
              <div class="relative min-w-16 h-16">
                <img src={getAlbumArt()} alt={`${track()?.album} album art`} class="w-16 h-16 rounded-md object-cover" onLoad={() => setTimeout(() => setIsVisible(true), 1)} />
                {track()?.isPlaying && isVisible() && (
                  <div class="absolute -bottom-2 -right-2 flex items-end gap-[2px] bg-neutral-900/90 p-1.5 rounded-md">
                    <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-1" />
                    <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-2" />
                    <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-3" />
                  </div>
                )}
              </div>
              <div class="flex flex-col min-w-0 flex-1 mr-2">
                <span class="font-medium text-neutral-200 truncate group-hover:text-rose-400/80 transition-colors">{track()?.name}</span>
                <span class="text-neutral-400 text-sm truncate">{track()?.artist}</span>
                <span class="text-neutral-500 text-sm truncate">{track()?.album}</span>
              </div>
            </a>
            <button
              onClick={handlePlayPreview}
              class={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400/80 
                     transition-colors duration-300
                     ${isVisible() ? "animate-fade-in" : "opacity-0"}`}
              title={isPlaying() ? "Pause Preview" : "Play Preview"}>
              {isPlaying() ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
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
