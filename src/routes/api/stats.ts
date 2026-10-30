import { createFileRoute } from "@tanstack/react-router";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { LIVE_CACHE, notAllowed, room } from "@/server/api";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const stats = await room().stats();
          // The page only shows post reads; the table also holds old junk paths.
          const paths = Object.fromEntries(
            PUBLISHED_META.map((post) => {
              const path = `/blog/${post.slug}`;
              return [path, stats.paths[path] ?? 0];
            })
          );
          return Response.json({ ...stats, paths }, { headers: LIVE_CACHE });
        } catch (error) {
          console.error("stats", error);
          return new Response(null, { status: 503 });
        }
      },
      ANY: notAllowed("GET"),
    },
  },
});
