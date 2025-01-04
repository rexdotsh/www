export interface SpotifyArtist {
  name: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
}

export interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

export interface SpotifyTrackData {
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
  id: string;
}

export interface SpotifyTrack {
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
