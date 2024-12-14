import {APIEvent} from "@solidjs/start/server";
import type {SpotifyResponse} from "../../lib/spotify";

export async function GET({request}: APIEvent) {
  try {
    const response = await fetch("https://lastfm-last-played.biancarosa.com.br/rexdotsh/latest-song");
    const data: SpotifyResponse = await response.json();

    return new Response(
      JSON.stringify({
        isPlaying: data.track["@attr"]?.nowplaying === "true",
        name: data.track.name,
        artist: data.track.artist["#text"],
        album: data.track.album["#text"],
        url: data.track.url,
        image: data.track.image,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Spotify API Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}
