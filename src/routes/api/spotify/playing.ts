import { Redis } from "@upstash/redis";
import { createFileRoute } from "@tanstack/react-router";

const SPOTIFY_API = {
  NOW_PLAYING: "https://api.spotify.com/v1/me/player/currently-playing",
  RECENTLY_PLAYED:
    "https://api.spotify.com/v1/me/player/recently-played?limit=1",
  TOKEN: "https://accounts.spotify.com/api/token",
} as const;

const TOKEN_CACHE_KEY = "spotify:token";

let redis: Redis | undefined;

type SpotifyToken = {
  access_token: string;
  expires_at: number;
};

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
};

type SpotifyArtist = {
  name: string;
};

type SpotifyImage = {
  url: string;
  height: number;
};

type SpotifyAlbum = {
  name: string;
  images: SpotifyImage[];
};

type SpotifyTrack = {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: {
    spotify: string;
  };
  id: string;
};

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!(url && token)) {
    throw new Error("Missing Redis environment variables");
  }

  redis ??= new Redis({ url, token });
  return redis;
}

async function getAccessToken() {
  const cache = getRedis();
  const cached = await cache.get<SpotifyToken>(TOKEN_CACHE_KEY);
  if (cached && Date.now() < cached.expires_at) {
    return cached.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!(clientId && clientSecret && refreshToken)) {
    throw new Error("Missing Spotify credentials");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(SPOTIFY_API.TOKEN, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get access token");
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  if (!(data.access_token && Number.isFinite(data.expires_in))) {
    throw new Error("Spotify returned an invalid access token");
  }

  const expiresIn = Math.max(data.expires_in - 60, 1);

  const token: SpotifyToken = {
    access_token: data.access_token,
    expires_at: Date.now() + expiresIn * 1000,
  };

  await cache.set(TOKEN_CACHE_KEY, token, { ex: expiresIn });

  return token.access_token;
}

async function getNowPlaying(token: string) {
  const response = await fetch(SPOTIFY_API.NOW_PLAYING, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 204) {
    return getRecentlyPlayed(token);
  }

  if (!response.ok) {
    throw new Error("Failed to fetch now playing");
  }

  const data = await response.json();
  if (!data.item) {
    return null;
  }

  return transformTrackData(data.item as SpotifyTrack, data.is_playing);
}

async function getRecentlyPlayed(token: string) {
  const response = await fetch(SPOTIFY_API.RECENTLY_PLAYED, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recently played");
  }

  const data = await response.json();
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

export const Route = createFileRoute("/api/spotify/playing")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const token = await getAccessToken();
          const track = await getNowPlaying(token);
          return Response.json(track ?? null);
        } catch {
          return Response.json(null);
        }
      },
    },
  },
});
