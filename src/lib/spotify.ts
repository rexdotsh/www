const SPOTIFY_API = {
  NOW_PLAYING: "https://api.spotify.com/v1/me/player/currently-playing",
  RECENTLY_PLAYED:
    "https://api.spotify.com/v1/me/player/recently-played?limit=1",
} as const;

interface SpotifyArtist {
  name: string;
}

interface SpotifyImage {
  height: number;
  url: string;
}

interface SpotifyAlbum {
  images: SpotifyImage[];
  name: string;
}

interface SpotifyTrack {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  external_urls: {
    spotify: string;
  };
  id: string;
  name: string;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing?: boolean;
  item?: SpotifyTrack;
}

interface SpotifyRecentlyPlayedResponse {
  items?: Array<{ track: SpotifyTrack }>;
}

export interface NowPlaying {
  album: string;
  artist: string;
  id: string;
  image: Array<{ "#text": string; size: string }>;
  isPlaying: boolean;
  name: string;
  url: string;
}

export async function getNowPlaying(
  token: string,
  signal: AbortSignal
): Promise<NowPlaying | null> {
  const response = await fetch(SPOTIFY_API.NOW_PLAYING, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (response.status === 204) {
    return getRecentlyPlayed(token, signal);
  }

  if (!response.ok) {
    throw new Error("Failed to fetch now playing");
  }

  const data = (await response.json()) as SpotifyCurrentlyPlayingResponse;
  if (!data.item) {
    return null;
  }

  return transformTrackData(data.item as SpotifyTrack, data.is_playing);
}

async function getRecentlyPlayed(token: string, signal: AbortSignal) {
  const response = await fetch(SPOTIFY_API.RECENTLY_PLAYED, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recently played");
  }

  const data = (await response.json()) as SpotifyRecentlyPlayedResponse;
  return data.items?.[0]
    ? transformTrackData(data.items[0].track as SpotifyTrack)
    : null;
}

function getImageSize(height: number): string {
  if (height <= 64) {
    return "small";
  }
  if (height <= 300) {
    return "medium";
  }
  return "large";
}

function transformTrackData(data: SpotifyTrack, isPlaying = false) {
  return {
    isPlaying,
    name: data.name,
    artist: data.artists.map((artist) => artist.name).join(", "),
    album: data.album.name,
    image: data.album.images.map((img) => ({
      "#text": img.url,
      size: getImageSize(img.height),
    })),
    url: data.external_urls.spotify,
    id: data.id,
  };
}
