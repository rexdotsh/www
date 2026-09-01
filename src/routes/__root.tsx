import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import NotFoundPage from "@/components/not-found";
import { SITE_HEADERS } from "@/lib/headers";
import { getSiteInfo } from "@/lib/site";
import geistMonoWoff2 from "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url";
import appCss from "../styles.css?url";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createRootRoute({
  headers: () => ({
    ...SITE_HEADERS,
    "Cache-Control": "no-store",
  }),
  loader: () => getSiteInfo(),
  staleTime: Number.POSITIVE_INFINITY,
  head: ({ loaderData }) => {
    const baseUrl = loaderData?.baseUrl ?? DEFAULT_BASE_URL;
    const hostname = loaderData?.hostname ?? "rex.wf";
    const isPublicHost = loaderData?.isPublicHost ?? false;
    const name = hostname === "mridul.sh" ? "mridul" : "rex";
    const title = `${name}'s space`;
    const description = "projects, writing, and whatever's playing.";
    const canonicalUrl = new URL("/", baseUrl).href;
    const imageUrl = new URL(
      name === "mridul" ? "/social-card-mridul.png" : "/social-card.png",
      baseUrl
    ).href;

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        { title },
        { name: "description", content: description },
        { name: "author", content: name },
        {
          name: "robots",
          content: isPublicHost ? "index,follow" : "noindex,nofollow",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
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
        { name: "twitter:site", content: "@rexmkv" },
        { name: "twitter:creator", content: "@rexmkv" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        {
          rel: "preload",
          href: geistMonoWoff2,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous",
        },
        { rel: "icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/image.png" },
        { rel: "canonical", href: canonicalUrl },
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
                url: canonicalUrl,
              },
              {
                "@type": "Person",
                name,
                sameAs: ["https://github.com/rexdotsh", "https://x.com/rexmkv"],
                url: canonicalUrl,
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
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta content="#faf8f2" name="theme-color" />
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
