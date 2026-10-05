import { createFileRoute } from "@tanstack/react-router";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";
import { notAllowed } from "@/server/api";

const PLAYING_CACHE_CONTROL = "public, max-age=10";
const PLAYING_CLOUDFLARE_CACHE_CONTROL =
  "public, max-age=30, stale-while-revalidate=60";

export const Route = createFileRoute("/api/spotify/playing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = await getAccessToken(request.signal);
          const track = await getNowPlaying(token, request.signal);
          return Response.json(track, {
            headers: {
              "Cache-Control": PLAYING_CACHE_CONTROL,
              "Cloudflare-CDN-Cache-Control": PLAYING_CLOUDFLARE_CACHE_CONTROL,
            },
          });
        } catch (error) {
          console.error("spotify playing", error);
          return Response.json(null, {
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
      ANY: notAllowed("GET"),
    },
  },
});
