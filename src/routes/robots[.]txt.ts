import { createFileRoute } from "@tanstack/react-router";
import { resolveSiteInfo } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const { baseUrl, isPublicHost } = resolveSiteInfo(request);
        const robots = isPublicHost
          ? `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`
          : `User-agent: *
Disallow: /
`;

        return new Response(robots, {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Cloudflare-CDN-Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      },
    },
  },
});
