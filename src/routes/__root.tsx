import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/theme-toggle";
import NotFoundPage from "@/components/not-found";
import { getSiteInfo } from "@/lib/site";
import appCss from "../styles.css?url";

const DEFAULT_BASE_URL = "https://rex.wf";

export const Route = createRootRoute({
  loader: () => getSiteInfo(),
  head: ({ loaderData }) => {
    const baseUrl = loaderData?.baseUrl ?? DEFAULT_BASE_URL;
    const hostname = loaderData?.hostname ?? "rex.wf";
    const name = hostname.includes("mridul.sh") ? "mridul" : "rex";
    const title = `${name}'s space`;
    const description = `${name}'s personal website`;
    const imageUrl = new URL("/image.png", baseUrl).href;

    return {
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: baseUrl },
        { property: "og:site_name", content: title },
        { property: "og:type", content: "website" },
        { property: "og:image", content: imageUrl },
        { property: "og:image:width", content: "192" },
        { property: "og:image:height", content: "192" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico" },
      ],
      scripts: [
        {
          src: "https://ingest.rex.wf/script.js",
          defer: true,
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
        <meta
          content="#f2ecdf"
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content="#030303"
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
        <HeadContent />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <ThemeToggle />
          <Analytics basePath="/monitor" framework="tanstack-start" />
          <SpeedInsights basePath="/monitor" framework="tanstack-start" />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
