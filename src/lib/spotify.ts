export interface SpotifyImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge";
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  isPlaying: boolean;
  url: string;
  image: SpotifyImage[];
}

export interface SpotifyResponse {
  track: {
    "@attr"?: {
      nowplaying: string;
    };
    name: string;
    url: string;
    artist: {
      "#text": string;
    };
    album: {
      "#text": string;
    };
    image: SpotifyImage[];
  };
}
