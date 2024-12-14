import {Component, createEffect, createSignal, onCleanup} from "solid-js";
import type {SpotifyTrack} from "../../lib/spotify";

const SpotifyNowPlaying: Component = () => {
  const [track, setTrack] = createSignal<SpotifyTrack | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [isVisible, setIsVisible] = createSignal(false);

  const fetchNowPlaying = async () => {
    try {
      const response = await fetch("https://lastfm-last-played.biancarosa.com.br/rexdotsh/latest-song");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      setTrack({
        isPlaying: data.track["@attr"]?.nowplaying === "true",
        name: data.track.name,
        artist: data.track.artist["#text"],
        album: data.track.album["#text"],
        url: data.track.url,
        image: data.track.image,
      });
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
    <div class="fixed bottom-20 w-full px-6">
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
                <div class="absolute -bottom-2 -right-2 flex items-center gap-[3px] bg-neutral-900/90 p-1.5 rounded-md">
                  <span class="w-[3px] h-3 bg-rose-400/80 animate-spotify-bar" />
                  <span class="w-[3px] h-3 bg-rose-400/80 animate-spotify-bar delay-[0.25s]" />
                  <span class="w-[3px] h-3 bg-rose-400/80 animate-spotify-bar delay-[0.5s]" />
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
