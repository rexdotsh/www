import { DEFAULT_ORIGIN } from "@/lib/site";
import { ogImageUrl } from "@/lib/utils";

export const preloadFont = (href: string) =>
  ({
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  }) as const;

export const baseUrlOf = (matches: { loaderData?: unknown }[]) =>
  (matches[0]?.loaderData as { baseUrl?: string } | undefined)?.baseUrl ??
  DEFAULT_ORIGIN;

export const pageMeta = ({
  description,
  image,
  matches,
  title,
}: {
  description: string;
  image: string;
  matches: { loaderData?: unknown }[];
  title: string;
}) => {
  const imageUrl = ogImageUrl(image, baseUrlOf(matches));
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: title },
  ];
};

// https://github.com/discord/discord-api-docs/pull/8606
export const EMBED_REL = "discord:component-embed";

export const RSS_LINK = {
  rel: "alternate",
  type: "application/rss+xml",
  title: "writing — rss",
  href: "/blog/rss.xml",
} as const;
