import { createFileRoute } from "@tanstack/react-router";
import { finishConnect } from "@/lib/spotify-auth";

export const Route = createFileRoute("/api/spotify/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const denied = params.get("error");
        if (denied) {
          return new Response(`spotify said: ${denied}`, { status: 400 });
        }
        const code = params.get("code");
        const state = params.get("state");
        if (!(code && state)) {
          return new Response("missing code or state", { status: 400 });
        }
        try {
          const expiresAt = await finishConnect(
            new URL(request.url).origin,
            code,
            state,
            request.signal
          );
          return new Response(
            `spotify connected. good until ~${expiresAt.toDateString()}.`
          );
        } catch (error) {
          console.error("spotify connect failed:", error);
          return new Response("spotify connect failed, check the logs", {
            status: 502,
          });
        }
      },
    },
  },
});
