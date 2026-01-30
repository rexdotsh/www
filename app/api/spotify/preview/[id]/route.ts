// ref: https://github.com/rexdotsh/spotify-preview-url-workaround

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUDIO_PREVIEW_REGEX = /"audioPreview":\s*{\s*"url":\s*"([^"]+)"/;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const embedUrl = `https://open.spotify.com/embed/track/${id}`;

    const response = await fetch(embedUrl);
    const html = await response.text();

    const matches = html.match(AUDIO_PREVIEW_REGEX);
    const previewUrl = matches ? matches[1] : null;

    if (!previewUrl) {
      return NextResponse.json(
        { error: "No preview URL found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    console.error("Failed to fetch preview URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview URL" },
      { status: 500 }
    );
  }
}
