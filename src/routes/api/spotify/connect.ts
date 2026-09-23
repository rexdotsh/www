import { createFileRoute } from "@tanstack/react-router";
import { beginConnect, isConnectKey } from "@/lib/spotify-auth";

export const Route = createFileRoute("/api/spotify/connect")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        if (!isConnectKey(url.searchParams.get("key"))) {
          return new Response("not found", { status: 404 });
        }
        return Response.redirect(beginConnect(url.origin), 302);
      },
    },
  },
});
