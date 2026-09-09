import { createFileRoute } from "@tanstack/react-router";
import { FALLBACK_STATS } from "@/lib/stats";
import { room } from "@/server/room";

const headers = {
  "Cache-Control": "public, max-age=15",
  "Cloudflare-CDN-Cache-Control": "public, max-age=30",
};

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        const stub = room();
        if (!stub) {
          return Response.json(FALLBACK_STATS, { headers });
        }
        try {
          return Response.json(await stub.stats(), { headers });
        } catch (error) {
          console.error("stats", error);
          return new Response(null, { status: 503 });
        }
      },
    },
  },
});
