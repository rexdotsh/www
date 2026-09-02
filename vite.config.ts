import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkReadingTime from "remark-reading-time";
import remarkReadingTimeExport from "remark-reading-time/mdx.js";
import type { ShikiTransformer } from "shiki";
import { defineConfig } from "vite";
import { SITE_HEADERS } from "./src/lib/headers.ts";
import { PAPER, PAPER_DARK } from "./src/lib/shiki-themes.ts";

// the copy button needs the raw source at runtime; the corner label needs the language
const rawCodeTransformer: ShikiTransformer = {
  pre(node) {
    node.properties["data-code"] = this.source;
    node.properties["data-lang"] = this.options.lang;
  },
};

const STATIC_ASSET_HEADERS = {
  headers: {
    "cache-control": "public, max-age=86400",
    "cloudflare-cdn-cache-control":
      "public, max-age=31536000, stale-while-revalidate=604800",
  },
};

export default defineConfig({
  build: {
    rolldownOptions: {
      external: ["cloudflare:workers"],
    },
  },
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        rehypePlugins: [
          rehypeSlug,
          rehypeExtractToc,
          [rehypeExtractTocExport, { name: "tableOfContents" }],
          [
            rehypeShiki,
            {
              // tokens baked at build time; the client ships zero highlighter
              themes: { light: PAPER, dark: PAPER_DARK },
              defaultColor: false,
              transformers: [rawCodeTransformer],
            },
          ],
        ],
        remarkPlugins: [remarkGfm, remarkReadingTime, remarkReadingTimeExport],
      }),
    },
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro({
      preset: "cloudflare_module",
      routeRules: {
        "/**": {
          headers: SITE_HEADERS,
        },
        "/favicon.ico": STATIC_ASSET_HEADERS,
        "/image.png": STATIC_ASSET_HEADERS,
        "/social-card.png": STATIC_ASSET_HEADERS,
        "/social-card-mridul.png": STATIC_ASSET_HEADERS,
        "/og/**": STATIC_ASSET_HEADERS,
        "/twitter": {
          redirect: { to: "https://x.com/rexmkv", status: 308 },
        },
        "/x": {
          redirect: { to: "https://x.com/rexmkv", status: 308 },
        },
        "/github": {
          redirect: { to: "https://github.com/rexdotsh", status: 308 },
        },
        "/flora": {
          redirect: { to: "https://floraorg.github.io", status: 308 },
        },
      },
    }),
  ],
});
