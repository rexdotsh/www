// bun run fleet:key <host>  (FLEET_SECRET from .dev.vars)
import { HOSTS } from "../src/lib/fleet";

const [, , host] = process.argv;
const secret = process.env.FLEET_SECRET;
if (!(host && host in HOSTS && secret)) {
  process.stderr.write(
    `usage: FLEET_SECRET=... bun run fleet:key <${Object.keys(HOSTS).join("|")}>\n`
  );
  process.exit(1);
}
const enc = new TextEncoder();
const key = await crypto.subtle.importKey(
  "raw",
  enc.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"]
);
const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`fleet:${host}`));
process.stdout.write(
  `${Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("")}\n`
);
