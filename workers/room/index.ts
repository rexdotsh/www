// Entry for the www-room worker: both Durable Objects, no fetch handler.
// biome-ignore lint/performance/noBarrelFile: wrangler needs the classes exported from its entry
export { FleetStore } from "../../src/server/fleet";
export { Room } from "../../src/server/room";

export default {
  fetch: () => new Response(null, { status: 404 }),
} satisfies ExportedHandler;
