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

// Discord's component embed, linked rather than inline so its JSON stays out of
// the client bundle: https://github.com/discord/discord-api-docs/pull/8606
export const embedLink = (href: string) =>
  ({
    rel: "discord:component-embed",
    type: "application/vnd.discord.component-embed+json",
    href,
  }) as const;

export const RSS_LINK = {
  rel: "alternate",
  type: "application/rss+xml",
  title: "writing — rss",
  href: "/blog/rss.xml",
} as const;
