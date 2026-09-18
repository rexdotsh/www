import { createFileRoute } from "@tanstack/react-router";
import { homeEmbed } from "@/lib/discord-embed";
import { resolveSiteInfo } from "@/lib/site";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";

// Discord fetches this (via <link rel="discord:component-embed">) every time
// the homepage is unfurled, so "something" can point at the current track
// while the HTML itself stays edge-cached.
const headers = {
  "Cache-Control": "public, max-age=30",
  "Cloudflare-CDN-Cache-Control": "public, max-age=60",
};

// Discord gives the whole crawl (page + payload + every image) 10 seconds.
const BUDGET_MS = 2500;

const nowPlaying = async (origin: string) => {
  const signal = AbortSignal.timeout(BUDGET_MS);
  const token = await getAccessToken(origin, signal);
  return getNowPlaying(token, signal);
};

export const Route = createFileRoute("/api/embed.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { baseUrl, hostname } = resolveSiteInfo(request);
        const track = await nowPlaying(baseUrl).catch(() => null);
        return Response.json(homeEmbed({ baseUrl, hostname, track }), {
          headers,
        });
      },
    },
  },
});
