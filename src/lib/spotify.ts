const NOW_PLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1";

interface SpotifyTrack {
  album: { images: Array<{ height: number; url: string }>; name: string };
  artists: Array<{ name: string }>;
  external_urls: { spotify: string };
  id: string;
  name: string;
}

export type NowPlaying = ReturnType<typeof transform>;

export async function getNowPlaying(token: string, signal: AbortSignal) {
  const headers = { Authorization: `Bearer ${token}` };
  const response = await fetch(NOW_PLAYING, { headers, signal });
  if (response.status === 204) {
    const recent = await fetch(RECENTLY_PLAYED, { headers, signal });
    if (!recent.ok) {
      throw new Error("Failed to fetch recently played");
    }
    const data = (await recent.json()) as {
      items?: Array<{ track: SpotifyTrack }>;
    };
    return data.items?.[0] ? transform(data.items[0].track) : null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch now playing");
  }
  const data = (await response.json()) as {
    is_playing?: boolean;
    item?: SpotifyTrack;
  };
  return data.item ? transform(data.item, data.is_playing) : null;
}

const size = (height: number) =>
  height <= 64 ? "small" : height <= 300 ? "medium" : "large";

function transform(data: SpotifyTrack, isPlaying = false) {
  return {
    isPlaying,
    name: data.name,
    artist: data.artists.map((artist) => artist.name).join(", "),
    album: data.album.name,
    image: data.album.images.map((img) => ({
      "#text": img.url,
      size: size(img.height),
    })),
    url: data.external_urls.spotify,
    id: data.id,
  };
}
