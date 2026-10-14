import { createFileRoute } from "@tanstack/react-router";
import { resolveSiteInfo } from "@/lib/site";
import { notAllowed, PAGES, STATIC_CACHE } from "@/server/api";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const { baseUrl, isPublicHost } = resolveSiteInfo(request);
        if (!isPublicHost) {
          return new Response("Not found", {
            headers: { "Cache-Control": "no-store" },
            status: 404,
          });
        }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  (path) => `  <url>\n    <loc>${baseUrl}${path}</loc>\n  </url>`
).join("\n")}
</urlset>
`;

        return new Response(sitemap, {
          headers: {
            ...STATIC_CACHE,
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
      ANY: notAllowed("GET"),
    },
  },
});
