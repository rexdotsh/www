import { getNormalizedURL } from "@tanstack/react-router/ssr/server";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { LINKS } from "@/lib/content";
import { SITE_HEADERS } from "@/lib/headers";

const start = createServerEntry({
  fetch: createStartHandler(defaultStreamHandler),
});

const REDIRECTS: Record<string, string> = {
  "/twitter": LINKS.twitter,
  "/x": LINKS.twitter,
  "/github": LINKS.github,
  "/flora": LINKS.flora,
};

const TRAILING_SLASH_RE = /(.)\/$/;

// Outside Start's entry so its own error responses get the headers too. Paths
// are matched as Start routes them, so an encoded /%5FserverFn/ can't dodge
// no-store.
export default {
  async fetch(...args: Parameters<typeof start.fetch>) {
    const { pathname } = getNormalizedURL(args[0].url).url;
    const to = REDIRECTS[pathname.replace(TRAILING_SLASH_RE, "$1")];
    // The visitor's query stays here: it means nothing to (and shouldn't leak to)
    // someone else's site.
    const response = to
      ? Response.redirect(to, 308)
      : await start.fetch(...args);
    // Redirect (and some fetched) responses have immutable headers.
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SITE_HEADERS)) {
      if (name === "Vary") {
        headers.append(name, value);
      } else {
        headers.set(name, value);
      }
    }
    // Browsers may cache a bare 308 with no bound; a moved link should heal.
    if (to) {
      headers.set("Cache-Control", "public, max-age=86400");
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
};
