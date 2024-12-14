import {APIEvent} from "@solidjs/start/server";

// https://stackoverflow.com/questions/79237053/android-spotify-api-preview-url-for-tracks-is-suddenly-being-returned-as-null
// TRILLION DOLLAR COMPANY BTW LOL
export async function GET({params}: APIEvent) {
  try {
    const {id} = params;
    const embedUrl = `https://open.spotify.com/embed/track/${id}`;

    const response = await fetch(embedUrl);
    const html = await response.text();

    const matches = html.match(/"audioPreview":\s*{\s*"url":\s*"([^"]+)"/);
    const previewUrl = matches ? matches[1] : null;

    if (!previewUrl) {
      return new Response(JSON.stringify({error: "No preview URL found"}), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({url: previewUrl}), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({error: "Failed to fetch preview URL"}), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
