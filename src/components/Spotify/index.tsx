import {Component, createEffect, createSignal, onCleanup} from "solid-js";
import type {SpotifyTrack} from "../../lib/spotify";

const SpotifyNowPlaying: Component = () => {
  const [track, setTrack] = createSignal<SpotifyTrack | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [isVisible, setIsVisible] = createSignal(false);

  const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  const SPOTIFY_REFRESH_TOKEN = import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN;

  const getAccessToken = async () => {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
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
      return data.access_token;
    } catch (err) {
      console.error("Failed to get access token:", err);
      return null;
    }
  };

  const fetchRecentlyPlayed = async (token: string) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.items?.[0]) {
        return null;
      }

      const trackInfo = {
        isPlaying: false,
        name: data.items[0].track.name,
        artist: data.items[0].track.artists.map((artist: any) => artist.name).join(", "),
        album: data.items[0].track.album.name,
        image: data.items[0].track.album.images.map((img: any) => ({
          "#text": img.url,
          size: img.height <= 64 ? "small" : img.height <= 300 ? "medium" : "large",
        })),
        url: data.items[0].track.external_urls.spotify,
      };

      return trackInfo;
    } catch (err) {
      console.error("Failed to fetch recently played:", err);
      return null;
    }
  };

  const fetchNowPlaying = async () => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Failed to get access token");

      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        const recentTrack = await fetchRecentlyPlayed(token);
        setTrack(recentTrack);
        return;
      }

      const data = await response.json();

      if (!data.item) {
        setTrack(null);
        return;
      }

      const trackInfo = {
        isPlaying: data.is_playing,
        name: data.item.name,
        artist: data.item.artists.map((artist: any) => artist.name).join(", "),
        album: data.item.album.name,
        image: data.item.album.images.map((img: any) => ({
          "#text": img.url,
          size: img.height <= 64 ? "small" : img.height <= 300 ? "medium" : "large",
        })),
        url: data.item.external_urls.spotify,
      };

      setTrack(trackInfo);
      setError(null);
    } catch (err) {
      setError("Failed to load track data");
      console.error(err);
    }
  };

  createEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    onCleanup(() => clearInterval(interval));
  });

  const getAlbumArt = () => {
    const images = track()?.image || [];
    const mediumImage = images.find((img) => img.size === "medium");
    return mediumImage?.["#text"] || "";
  };

  const handleImageLoad = () => {
    setTimeout(() => setIsVisible(true), 1);
  };

  return (
    <div class="fixed bottom-24 md:bottom-20 w-full px-6">
      <div class="max-w-sm mx-auto">
        {error() ? null : track() ? (
          <a
            href={track()?.url}
            target="_blank"
            rel="noopener noreferrer"
            class={`group flex items-center gap-4 bg-neutral-900/50 backdrop-blur-sm p-4 
                  rounded-lg border border-neutral-800 hover:border-neutral-700 
                  transition-all duration-300 
                  ${isVisible() ? "animate-fade-in" : "opacity-0"}`}>
            <div class="relative min-w-16 h-16">
              <img src={getAlbumArt()} alt={`${track()?.album} album art`} class="w-16 h-16 rounded-md object-cover" onLoad={handleImageLoad} />
              {track()?.isPlaying && isVisible() && (
                <div class="absolute -bottom-2 -right-2 flex items-end gap-[2px] bg-neutral-900/90 p-1.5 rounded-md">
                  <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-1" />
                  <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-2" />
                  <div class="w-[3px] h-3 bg-rose-400/80 origin-bottom animate-bar-3" />
                </div>
              )}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-medium text-neutral-200 truncate group-hover:text-rose-400/80 transition-colors">{track()?.name}</span>
              <span class="text-neutral-400 text-sm truncate">{track()?.artist}</span>
              <span class="text-neutral-500 text-sm truncate">{track()?.album}</span>
            </div>
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default SpotifyNowPlaying;
