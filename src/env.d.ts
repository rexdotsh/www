import type { Room } from "./server/room";

declare global {
  interface Env {
    ROOM: DurableObjectNamespace<Room>;
  }
  // biome-ignore lint/style/noNamespace: augmenting wrangler's generated namespace
  namespace Cloudflare {
    interface Env {
      ROOM: DurableObjectNamespace<Room>;
    }
  }
}
