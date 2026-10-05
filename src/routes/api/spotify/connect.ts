import { createFileRoute } from "@tanstack/react-router";
import { beginConnect, isConnectKey } from "@/lib/spotify-auth";
import { notAllowed } from "@/server/api";

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
      ANY: notAllowed("GET"),
    },
  },
});
