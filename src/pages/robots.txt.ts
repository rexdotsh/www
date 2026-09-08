import type { APIRoute } from "astro";
import { resolveSiteInfo } from "../lib/site";

export const GET: APIRoute = ({ request }) => {
  const { baseUrl, isPublicHost } = resolveSiteInfo(request);
  const robots = isPublicHost
    ? `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(robots, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Cloudflare-CDN-Cache-Control":
        "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
