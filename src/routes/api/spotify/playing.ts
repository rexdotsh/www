import { createFileRoute } from "@tanstack/react-router";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";

const PLAYING_CACHE_CONTROL = "public, max-age=10";
const PLAYING_CLOUDFLARE_CACHE_CONTROL =
  "public, max-age=30, stale-while-revalidate=86400";

export const Route = createFileRoute("/api/spotify/playing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = await getAccessToken(
            new URL(request.url).origin,
            request.signal
          );
          const track = await getNowPlaying(token, request.signal);
          return Response.json(track ?? null, {
            headers: {
              "Cache-Control": PLAYING_CACHE_CONTROL,
              "Cloudflare-CDN-Cache-Control": PLAYING_CLOUDFLARE_CACHE_CONTROL,
            },
          });
        } catch {
          return Response.json(null, {
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
