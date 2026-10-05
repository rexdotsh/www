import { createFileRoute } from "@tanstack/react-router";
import { PUBLISHED_META } from "@/lib/posts-meta";
import type { SiteStats } from "@/lib/stats";
import { notAllowed, room } from "@/server/api";

const headers = {
  "Cache-Control": "public, max-age=15",
  "Cloudflare-CDN-Cache-Control": "public, max-age=30",
};

const FALLBACK: SiteStats = {
  online: 3,
  today: 41,
  week: 1204,
  total: 48_213,
  recent: [
    { place: "tokyo", ago: "just now", path: "/", tag: "a" },
    { place: "berlin", ago: "4m", path: "/blog/parabox", tag: "b" },
    { place: "austin", ago: "11m", path: "/", tag: "c" },
    { place: "bengaluru", ago: "26m", path: "/", tag: "d" },
    { place: "somewhere", ago: "1h", path: "/blog", tag: "e" },
  ],
  paths: { "/": 5802, "/blog/parabox": 2214, "/blog": 1037 },
  hi: 12,
  signed: 17,
  guestbook: [
    {
      id: 3,
      name: "maya",
      message: "found you through the parabox writeup. the rose is unfair.",
      place: "berlin",
      ago: "2h",
    },
    {
      id: 2,
      name: "anonymous",
      message: "hi back.",
      place: "austin",
      ago: "1d",
    },
    {
      id: 1,
      name: "k",
      message: "what font is this",
      place: "tokyo",
      ago: "3d",
    },
  ],
};

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        const stub = room();
        if (!stub) {
          return Response.json(FALLBACK, { headers });
        }
        try {
          const stats = await stub.stats();
          // The page only shows post reads; the table also holds old junk paths.
          const paths = Object.fromEntries(
            PUBLISHED_META.map((post) => {
              const path = `/blog/${post.slug}`;
              return [path, stats.paths[path] ?? 0];
            })
          );
          return Response.json({ ...stats, paths }, { headers });
        } catch (error) {
          console.error("stats", error);
          return new Response(null, { status: 503 });
        }
      },
      ANY: notAllowed("GET"),
    },
  },
});
