import mdx from "@mdx-js/rollup";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeExtractTocExport from "@stefanprobst/rehype-extract-toc/mdx";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkReadingTime from "remark-reading-time";
import remarkReadingTimeExport from "remark-reading-time/mdx.js";
import type { ShikiTransformer } from "shiki";
import { defineConfig } from "astro/config";
import { PAPER, PAPER_DARK } from "./src/lib/shiki-themes";

const rawCodeTransformer: ShikiTransformer = {
  pre(node) {
    node.properties["data-code"] = this.source;
    node.properties["data-lang"] = this.options.lang;
  },
};

const ogImageVersion = createHash("sha256")
  .update(
    readFileSync(new URL("./public/social-card-rex.png", import.meta.url))
  )
  .update(
    readFileSync(new URL("./public/social-card-mridul.png", import.meta.url))
  )
  .digest("hex")
  .slice(0, 12);

export default defineConfig({
  adapter: cloudflare({ imageService: "passthrough" }),
  output: "server",
  session: false,
  redirects: {
    "/twitter": "https://x.com/rexmkv",
    "/x": "https://x.com/rexmkv",
    "/github": "https://github.com/rexdotsh",
    "/flora": "https://floraorg.github.io",
  },
  server: { port: 3000 },
  vite: {
    define: {
      "import.meta.env.VITE_OG_IMAGE_VERSION": JSON.stringify(ogImageVersion),
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
                themes: { light: PAPER, dark: PAPER_DARK },
                defaultColor: false,
                transformers: [rawCodeTransformer],
              },
            ],
          ],
          remarkPlugins: [
            remarkGfm,
            remarkReadingTime,
            remarkReadingTimeExport,
          ],
        }),
      },
      tailwindcss(),
    ],
  },
  integrations: [react()],
});
