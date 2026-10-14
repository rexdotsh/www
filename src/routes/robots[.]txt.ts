import { createFileRoute } from "@tanstack/react-router";
import { resolveSiteInfo } from "@/lib/site";
import { notAllowed, STATIC_CACHE } from "@/server/api";

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
            ...STATIC_CACHE,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      },
      ANY: notAllowed("GET"),
    },
  },
});
