import { defineMiddleware } from "astro:middleware";
import { SITE_HEADERS } from "./lib/headers";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SITE_HEADERS))
    headers.set(name, value);
  if (!headers.has("Cache-Control") && !response.headers.has("Cache-Control")) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    headers.set(
      "Cloudflare-CDN-Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
