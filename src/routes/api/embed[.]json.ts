import { createFileRoute } from "@tanstack/react-router";
import { homeEmbed } from "@/lib/discord-embed";
import { resolveSiteInfo } from "@/lib/site";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";

export const Route = createFileRoute("/api/embed.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { baseUrl, hostname } = resolveSiteInfo(request);
        const signal = AbortSignal.timeout(2500);
        const track = await getAccessToken(baseUrl, signal)
          .then((token) => getNowPlaying(token, signal))
          .catch(() => null);
        return Response.json(homeEmbed(baseUrl, hostname, track), {
          headers: {
            "Cache-Control": "public, max-age=30",
            "Cloudflare-CDN-Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
