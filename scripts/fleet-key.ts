import { HOSTS, hostKey } from "../src/lib/fleet";

const [, , host] = process.argv;
const secret = process.env.FLEET_SECRET;
if (!(host && host in HOSTS && secret)) {
  process.stderr.write(
    `usage: FLEET_SECRET=... bun run fleet:key <${Object.keys(HOSTS).join("|")}>\n`
  );
  process.exit(1);
}
process.stdout.write(`${await hostKey(secret, host)}\n`);
