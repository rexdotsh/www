// ref: https://github.com/rexdotsh/spotify-preview-url-workaround

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const embedUrl = `https://open.spotify.com/embed/track/${id}`;

    const response = await fetch(embedUrl);
    const html = await response.text();

    const matches = html.match(/"audioPreview":\s*{\s*"url":\s*"([^"]+)"/);
    const previewUrl = matches ? matches[1] : null;

    if (!previewUrl) {
      return NextResponse.json({ error: "No preview URL found" }, { status: 404 });
    }

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch preview URL: ${error}` }, { status: 500 });
  }
}
