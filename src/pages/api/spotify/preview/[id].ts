// ref: https://github.com/rexdotsh/spotify-preview-url-workaround

import type { APIRoute } from "astro";

const AUDIO_PREVIEW_REGEX = /"audioPreview":\s*{\s*"url":\s*"([^"]+)"/;
const SPOTIFY_TRACK_ID_REGEX = /^[A-Za-z0-9]{22}$/;

export const GET: APIRoute = async ({ params, request }) => {
  if (!params.id || !SPOTIFY_TRACK_ID_REGEX.test(params.id)) {
    return Response.json(
      { error: "Invalid Spotify track ID" },
      { status: 400 }
    );
  }

  try {
    const embedUrl = `https://open.spotify.com/embed/track/${params.id}`;
    const response = await fetch(embedUrl, { signal: request.signal });
    if (!response.ok) {
      throw new Error(`Spotify returned ${response.status}`);
    }

    const html = await response.text();
    const previewUrl = html.match(AUDIO_PREVIEW_REGEX)?.[1];

    if (!previewUrl) {
      return Response.json({ error: "No preview URL found" }, { status: 404 });
    }

    return Response.json(
      { url: previewUrl },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Cloudflare-CDN-Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch preview URL:", error);
    return Response.json(
      { error: "Failed to fetch preview URL" },
      { status: 500 }
    );
  }
};
