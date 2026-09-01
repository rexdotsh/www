import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { SITE_HEADERS } from "./src/lib/headers.ts";

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
        "/rose.avif": STATIC_ASSET_HEADERS,
        "/social-card.png": STATIC_ASSET_HEADERS,
        "/social-card-mridul.png": STATIC_ASSET_HEADERS,
        "/blog": {
          redirect: { to: "https://blog.rex.wf", status: 308 },
        },
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
