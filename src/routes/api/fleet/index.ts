import { createFileRoute } from "@tanstack/react-router";
import { mockFleet } from "@/lib/fleet";
import { fleet } from "@/server/fleet-auth";

const headers = {
  "Cache-Control": "public, max-age=15",
  "Cloudflare-CDN-Cache-Control": "public, max-age=30",
};

export const Route = createFileRoute("/api/fleet/")({
  server: {
    handlers: {
      GET: async () => {
        const stub = fleet();
        if (!stub) {
          return Response.json(mockFleet(), { headers });
        }
        try {
          return Response.json(await stub.snapshot(), { headers });
        } catch (error) {
          console.error("fleet", error);
          return new Response(null, { status: 503 });
        }
      },
    },
  },
});
