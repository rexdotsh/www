import mdx from "@mdx-js/rollup";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkReadingTime from "remark-reading-time";
import remarkReadingTimeExport from "remark-reading-time/mdx.js";
import { createHighlighterCore, type ShikiTransformer } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { defineConfig } from "vite";
import { SITE_HEADERS } from "./src/lib/headers.ts";
import { PAPER, PAPER_DARK } from "./src/lib/shiki-themes.ts";

const rawCodeTransformer: ShikiTransformer = {
  pre(node) {
    node.properties["data-code"] = this.source;
    node.properties["data-lang"] = this.options.lang;
  },
};

// Only the grammars the posts actually use, on the JS engine: no WASM, no
// full-bundle import. Add a lang here when a post needs one.
const highlighter = await createHighlighterCore({
  themes: [PAPER, PAPER_DARK],
  langs: [import("@shikijs/langs/c"), import("@shikijs/langs/python")],
  engine: createJavaScriptRegexEngine(),
});

const STATIC_ASSET_HEADERS = {
  headers: {
    "cache-control": "public, max-age=86400",
    "cloudflare-cdn-cache-control":
      "public, max-age=31536000, stale-while-revalidate=604800",
  },
};

const PUBLIC_DIR = new URL("./public/", import.meta.url);
const OG_DIR = new URL("og/", PUBLIC_DIR);

const OG_IMAGE_VERSION = [
  "social-card-rex.png",
  "social-card-mridul.png",
  ...(existsSync(OG_DIR)
    ? readdirSync(OG_DIR)
        .filter((file) => file.endsWith(".png"))
        .sort()
        .map((file) => `og/${file}`)
    : []),
]
  .reduce(
    (hash, file) =>
      hash.update(file).update(readFileSync(new URL(file, PUBLIC_DIR))),
    createHash("sha256")
  )
  .digest("hex")
  .slice(0, 12);

export default defineConfig({
  define: {
    "import.meta.env.VITE_OG_IMAGE_VERSION": JSON.stringify(OG_IMAGE_VERSION),
  },
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
            rehypeShikiFromHighlighter,
            highlighter,
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
        "/social-card-rex.png": STATIC_ASSET_HEADERS,
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
