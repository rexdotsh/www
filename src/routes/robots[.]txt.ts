import { createFileRoute } from "@tanstack/react-router";
import { resolveSiteInfo } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const { baseUrl } = resolveSiteInfo(request);
        const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

        return new Response(robots, {
          headers: {
            "Cache-Control":
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      },
    },
  },
});
