import { createFileRoute } from "@tanstack/react-router";
import { resolveSiteInfo } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const { baseUrl } = resolveSiteInfo(request);
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
  </url>
</urlset>
`;

        return new Response(sitemap, {
          headers: {
            "Cache-Control":
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
