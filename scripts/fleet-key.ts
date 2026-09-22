// Prints a box's key: bun run fleet:key <host>. Needs FLEET_SECRET in .dev.vars.
import { HOSTS } from "../src/lib/fleet";

const [, , host] = process.argv;
const secret = process.env.FLEET_SECRET;
if (!(host && host in HOSTS)) {
  console.error(`usage: bun run fleet:key <${Object.keys(HOSTS).join("|")}>`);
  process.exit(1);
}
if (!secret) {
  console.error("FLEET_SECRET is not set");
  process.exit(1);
}
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);
const mac = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(`fleet:${host}`)
);
const hex = Array.from(new Uint8Array(mac), (b) =>
  b.toString(16).padStart(2, "0")
).join("");
process.stdout.write(`${hex}\n`);
