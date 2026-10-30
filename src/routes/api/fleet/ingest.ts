import { createFileRoute } from "@tanstack/react-router";
import { fleet, notAllowed } from "@/server/api";
import { verify } from "@/server/fleet-auth";

export const Route = createFileRoute("/api/fleet/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const result = await verify(request);
        if (!result.ok) {
          return new Response(null, { status: result.status });
        }
        try {
          const fresh = await fleet().ingest(
            result.host,
            result.sample,
            result.ts
          );
          return new Response(null, { status: fresh ? 204 : 409 });
        } catch (error) {
          console.error("fleet ingest", error);
          return new Response(null, { status: 500 });
        }
      },
      ANY: notAllowed("POST"),
    },
  },
});
