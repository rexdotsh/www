import { createFileRoute } from "@tanstack/react-router";
import { homeEmbed } from "@/lib/discord-embed";
import { resolveSiteInfo } from "@/lib/site";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";
import { room } from "@/server/api";

// Discord fetches this (via <link rel="discord:component-embed">) every time
// the homepage is unfurled, so the card reflects the site as it is right now
// while the HTML itself stays edge-cached.
const headers = {
  "Cache-Control": "public, max-age=30",
  "Cloudflare-CDN-Cache-Control": "public, max-age=60",
};

// Discord gives the whole crawl (page + payload + every image) 10 seconds.
const BUDGET_MS = 2500;

// Linked payloads are capped at 3,000 raw bytes.
const MAX_BYTES = 3000;

const nowPlaying = async (origin: string) => {
  const signal = AbortSignal.timeout(BUDGET_MS);
  const token = await getAccessToken(origin, signal);
  return getNowPlaying(token, signal);
};

const siteStats = async () => {
  const stub = room();
  if (!stub) {
    return null;
  }
  return await Promise.race([
    stub.stats(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), BUDGET_MS)),
  ]);
};

export const Route = createFileRoute("/api/embed.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { baseUrl, hostname } = resolveSiteInfo(request);
        const [track, stats] = await Promise.all([
          nowPlaying(baseUrl).catch(() => null),
          siteStats().catch(() => null),
        ]);

        let embed = homeEmbed({ baseUrl, hostname, stats, track });
        let body = JSON.stringify(embed);
        if (new TextEncoder().encode(body).byteLength > MAX_BYTES) {
          embed = homeEmbed({ baseUrl, hostname, stats: null, track });
          body = JSON.stringify(embed);
        }

        return new Response(body, {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      },
    },
  },
});
