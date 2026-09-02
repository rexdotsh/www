import { createFileRoute } from "@tanstack/react-router";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { resolveSiteInfo } from "@/lib/site";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const { baseUrl, hostname, isPublicHost } = resolveSiteInfo(request);
        if (!isPublicHost) {
          return new Response("Not found", {
            headers: { "Cache-Control": "no-store" },
            status: 404,
          });
        }

        const name = hostname === "mridul.sh" ? "mridul" : "rex";
        const items = PUBLISHED_META.map((post) => {
          const url = `${baseUrl}/blog/${post.slug}`;
          return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
        }).join("\n");

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${name}'s writing</title>
    <link>${baseUrl}/blog</link>
    <description>occasional writeups and notes.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

        return new Response(rss, {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Cloudflare-CDN-Cache-Control":
              "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": "application/rss+xml; charset=utf-8",
          },
        });
      },
    },
  },
});
