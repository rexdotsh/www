import type { FleetStore } from "./server/fleet";
import type { Room } from "./server/room";

declare global {
  interface Env {
    FLEET: DurableObjectNamespace<FleetStore>;
    FLEET_SECRET: string;
    ROOM: DurableObjectNamespace<Room>;
  }
  // biome-ignore lint/style/noNamespace: augmenting wrangler's generated namespace
  namespace Cloudflare {
    interface Env {
      FLEET: DurableObjectNamespace<FleetStore>;
      FLEET_SECRET: string;
      ROOM: DurableObjectNamespace<Room>;
    }
  }
}
