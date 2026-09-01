import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
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
      routeRules: {
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
