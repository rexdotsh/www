const NOW_PLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLY_PLAYED =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1";

interface RawTrack {
  album: { images: { height: number; url: string }[]; name: string };
  artists: { name: string }[];
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
      items?: { track: RawTrack }[];
    };
    return data.items?.[0] ? transform(data.items[0].track) : null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch now playing");
  }
  const data = (await response.json()) as {
    is_playing?: boolean;
    item?: RawTrack;
  };
  return data.item ? transform(data.item, data.is_playing) : null;
}

function transform(data: RawTrack, isPlaying = false) {
  const { images } = data.album;
  const cover =
    images.find((image) => image.height > 64 && image.height <= 300)?.url ??
    null;
  return {
    isPlaying,
    name: data.name,
    artist: data.artists.map((artist) => artist.name).join(", "),
    album: data.album.name,
    // The card shows the ~300px cover; the rose samples a 27x27 grid of the
    // smallest.
    cover,
    thumb: images.find((image) => image.height <= 64)?.url ?? cover,
    url: data.external_urls.spotify,
    id: data.id,
  };
}
