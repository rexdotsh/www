export interface SpotifyImage {
  "#text": string;
  size: "small" | "medium" | "large";
}

export interface SpotifyTrack {
  isPlaying: boolean;
  name: string;
  artist: string;
  album: string;
  image: Array<{
    "#text": string;
    size: string;
  }>;
  url: string;
}

export interface SpotifyResponse {
  track: {
    "@attr"?: {
      nowplaying: string;
    };
    name: string;
    artist: {
      "#text": string;
    };
    album: {
      "#text": string;
    };
    image: SpotifyImage[];
    date?: {
      uts: string;
      "#text": string;
    };
  };
}
