import {
  HeadContent,
  Scripts,
  createRootRoute,
  useLocation,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import CornerNotes, { FIRST_PAINT_SCRIPT } from "@/components/corner-notes";
import NotFoundPage from "@/components/not-found";
import { getIdentity, LINKS } from "@/lib/content";
import { baseUrlOf, preloadFont, RSS_LINK } from "@/lib/head";
import { getSiteInfo } from "@/lib/site";
import { useBeacon } from "@/lib/use-stats";
import { ogImageUrl } from "@/lib/utils";
import geistMonoWoff2 from "../fonts/geist-mono-latin.woff2?url";
import instrumentWoff2 from "../fonts/instrument-serif-latin.woff2?url";
import appCss from "../styles.css?url";

const TRAILING_SLASH_RE = /(.)\/$/;

export const Route = createRootRoute({
  headers: () => ({
    // The document is static per hostname; keep browser validation cheap while
    // allowing Cloudflare to serve repeat navigations from the edge.
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Cloudflare-CDN-Cache-Control": "public, max-age=3600",
  }),
  loader: () => getSiteInfo(),
  staleTime: Number.POSITIVE_INFINITY,
  head: ({ loaderData, matches }) => {
    const baseUrl = baseUrlOf(matches);
    const identity = getIdentity(loaderData?.hostname ?? "");
    // Every page has a leaf route under the root; an unknown path has none.
    const found = matches.length > 1;
    const title = found ? `${identity.name}'s space` : "not found";
    const description = "projects, writing, and whatever's playing.";
    const homeUrl = new URL("/", baseUrl).href;
    const path = (matches.at(-1)?.pathname ?? "/").replace(
      TRAILING_SLASH_RE,
      "$1"
    );
    const pageUrl = new URL(path, baseUrl).href;
    const imageUrl = ogImageUrl(`/social-card-${identity.name}.png`, baseUrl);

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
        },
        { title },
        { name: "description", content: description },
        { name: "author", content: identity.name },
        {
          name: "robots",
          content: loaderData?.isPublicHost
            ? "index,follow"
            : "noindex,nofollow",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "en_US" },
        { property: "og:image", content: imageUrl },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: title },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
        { name: "twitter:image:alt", content: title },
        { name: "twitter:site", content: `@${identity.handle}` },
        { name: "twitter:creator", content: `@${identity.handle}` },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        preloadFont(instrumentWoff2),
        preloadFont(geistMonoWoff2),
        { rel: "icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/image.png" },
        RSS_LINK,
        ...(found ? [{ rel: "canonical", href: pageUrl }] : []),
        {
          rel: "preconnect",
          href: "https://ingest.rex.wf",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                description,
                name: title,
                url: homeUrl,
              },
              {
                "@type": "Person",
                name: identity.name,
                sameAs: [LINKS.github, LINKS.twitter],
                url: homeUrl,
              },
            ],
          }),
        },
        {
          src: "https://ingest.rex.wf/script.js",
          async: true,
          "data-website-id": "de1c2b87-5ec8-4a14-b3f4-5b3b76599ba1",
        },
      ],
    };
  },
  notFoundComponent: () => <NotFoundPage />,
  shellComponent: RootDocument,
});

function Beacon() {
  useBeacon(useLocation({ select: (location) => location.pathname }));
  return null;
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: static first-paint script */}
        <script dangerouslySetInnerHTML={{ __html: FIRST_PAINT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="antialiased">
        <CornerNotes />
        <Beacon />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
