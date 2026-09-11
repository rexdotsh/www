import { createFileRoute } from "@tanstack/react-router";
import { finishConnect } from "@/lib/spotify-auth";

const text = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

export const Route = createFileRoute("/api/spotify/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const denied = url.searchParams.get("error");
        if (denied) {
          return text(`spotify said: ${denied}`, 400);
        }
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!(code && state)) {
          return text("missing code or state", 400);
        }
        try {
          const expiresAt = await finishConnect(
            url.origin,
            code,
            state,
            request.signal
          );
          return text(
            `spotify connected. refresh token good until ~${expiresAt.toDateString()}.`
          );
        } catch (error) {
          console.error("spotify connect failed:", error);
          return text("spotify connect failed, check the logs", 502);
        }
      },
    },
  },
});
