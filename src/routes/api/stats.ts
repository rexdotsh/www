import { createFileRoute } from "@tanstack/react-router";
import type { SiteStats } from "@/lib/stats";
import { room } from "@/server/api";

const headers = {
  "Cache-Control": "public, max-age=15",
  "Cloudflare-CDN-Cache-Control": "public, max-age=30",
};

const FALLBACK: SiteStats = {
  mock: true,
  online: 3,
  today: 41,
  week: 1204,
  total: 48_213,
  recent: [
    { place: "tokyo", ago: "just now", path: "/" },
    { place: "berlin", ago: "4m", path: "/blog/parabox" },
    { place: "austin", ago: "11m", path: "/" },
    { place: "bengaluru", ago: "26m", path: "/" },
    { place: "somewhere", ago: "1h", path: "/blog" },
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
          return Response.json(await stub.stats(), { headers });
        } catch (error) {
          console.error("stats", error);
          return new Response(null, { status: 503 });
        }
      },
    },
  },
});
