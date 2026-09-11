// Durable-Object-only worker. `www` binds to it via `script_name` so the site
// worker itself has no DO class and keeps getting preview URLs.
// biome-ignore lint/performance/noBarrelFile: this is the worker entry
export { Room } from "../../src/server/room";

// Wrangler needs a module-format default export to accept the DO class.
export default {
  fetch: () => new Response(null, { status: 404 }),
} satisfies ExportedHandler;
