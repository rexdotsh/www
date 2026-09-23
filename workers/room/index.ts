// biome-ignore lint/performance/noBarrelFile: wrangler needs the classes exported from its entry
export { FleetStore } from "../../src/server/fleet";
export { Room } from "../../src/server/room";

// wrangler wants a module default.
export default {
  fetch: () => new Response(null, { status: 404 }),
} satisfies ExportedHandler;
