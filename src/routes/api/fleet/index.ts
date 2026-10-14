import { createFileRoute } from "@tanstack/react-router";
import { fleetSnapshot, notAllowed } from "@/server/api";

const headers = {
  "Cache-Control": "public, max-age=15",
  "Cloudflare-CDN-Cache-Control": "public, max-age=30",
};

export const Route = createFileRoute("/api/fleet/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await fleetSnapshot(), { headers });
        } catch (error) {
          console.error("fleet", error);
          return new Response(null, { status: 503 });
        }
      },
      ANY: notAllowed("GET"),
    },
  },
});
