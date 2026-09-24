import { ogImageUrl } from "@/lib/utils";

export const preloadFont = (href: string) =>
  ({
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  }) as const;

export const pageMeta = ({
  description,
  image,
  matches,
  path,
  title,
}: {
  description: string;
  image: string;
  matches: { loaderData?: unknown }[];
  path: string;
  title: string;
}) => {
  const baseUrl =
    (matches[0]?.loaderData as { baseUrl?: string } | undefined)?.baseUrl ??
    "https://rex.wf";
  const imageUrl = ogImageUrl(image, baseUrl);
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: `${baseUrl}${path}` },
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

export const RSS_LINK = {
  rel: "alternate",
  type: "application/rss+xml",
  title: "writing — rss",
  href: "/blog/rss.xml",
} as const;
