import { createFileRoute } from "@tanstack/react-router";
import { fleetSnapshot, LIVE_CACHE, notAllowed } from "@/server/api";

export const Route = createFileRoute("/api/fleet/")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await fleetSnapshot(), { headers: LIVE_CACHE });
        } catch (error) {
          console.error("fleet", error);
          return new Response(null, { status: 503 });
        }
      },
      ANY: notAllowed("GET"),
    },
  },
});
