import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { LINKS } from "@/lib/content";
import { SITE_HEADERS } from "@/lib/headers";

const handler = createStartHandler(defaultStreamHandler);

const REDIRECTS: Record<string, string> = {
  "/twitter": LINKS.twitter,
  "/x": LINKS.twitter,
  "/github": LINKS.github,
  "/flora": LINKS.flora,
};

export default createServerEntry({
  async fetch(request, opts) {
    const { pathname } = new URL(request.url);
    const to = REDIRECTS[pathname];
    const response = to
      ? Response.redirect(to, 308)
      : await handler(request, opts);
    // Redirect (and some fetched) responses have immutable headers.
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SITE_HEADERS)) {
      headers.set(name, value);
    }
    // Server functions carry live data; without this the Worker cache keeps them for hours.
    if (pathname.startsWith("/_serverFn/")) {
      headers.set("Cache-Control", "no-store");
    }
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  },
});
