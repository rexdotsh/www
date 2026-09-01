import { createFileRoute } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/lib/posts";
import { resolveSiteInfo } from "@/lib/site";

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

        const paths = [
          "/",
          "/blog",
          ...BLOG_POSTS.map((post) => `/blog/${post.slug}`),
        ];
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map((path) => `  <url>\n    <loc>${baseUrl}${path}</loc>\n  </url>`)
  .join("\n")}
</urlset>
`;

        return new Response(sitemap, {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Cloudflare-CDN-Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": "application/xml; charset=utf-8",
          },
        });
      },
    },
  },
});
