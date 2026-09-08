export const preloadFont = (href: string) =>
  ({
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  }) as const;

export const RSS_LINK = {
  rel: "alternate",
  type: "application/rss+xml",
  title: "writing — rss",
  href: "/blog/rss.xml",
} as const;
