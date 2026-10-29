import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkReadingTime from "remark-reading-time";
import remarkReadingTimeExport from "remark-reading-time/mdx.js";
import { createHighlighterCore, type ShikiTransformer } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { defineConfig, type Plugin } from "vite";
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

const LONG_LIVED = {
  "Cache-Control": "public, max-age=86400",
  "Cloudflare-CDN-Cache-Control":
    "public, max-age=31536000, stale-while-revalidate=604800",
};

// Static assets are served before the worker runs, so their headers come from
// a _headers file (the worker sets its own in src/server.ts).
const ASSET_HEADERS: Record<string, Record<string, string>> = {
  "/assets/*": { "Cache-Control": "public, max-age=31536000, immutable" },
  "/favicon.ico": LONG_LIVED,
  "/image.png": LONG_LIVED,
  "/social-card-*": LONG_LIVED,
  "/og/*": LONG_LIVED,
  "/*": SITE_HEADERS,
};

const assetHeaders: Plugin = {
  name: "asset-headers",
  applyToEnvironment: (environment) => environment.name === "client",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "_headers",
      source: Object.entries(ASSET_HEADERS)
        .map(
          ([path, headers]) =>
            `${path}\n${Object.entries(headers)
              .map(([name, value]) => `  ${name}: ${value}\n`)
              .join("")}`
        )
        .join(""),
    });
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
        .toSorted()
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
  server: {
    port: 3000,
  },
  environments: {
    // React only changes with a dependency bump: on its own its hash survives
    // deploys, instead of riding in the entry chunk every route change renames.
    client: {
      build: {
        rolldownOptions: {
          output: {
            codeSplitting: {
              groups: [
                {
                  name: "react",
                  test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                },
              ],
            },
          },
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
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
    assetHeaders,
  ],
});
