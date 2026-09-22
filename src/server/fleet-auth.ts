import { env } from "cloudflare:workers";
import { HOSTS, type Sample } from "@/lib/fleet";

const SKEW_S = 5 * 60;
const MAX_BODY = 16 * 1024;

export const fleet = () =>
  import.meta.env.DEV || !env.FLEET
    ? null
    : env.FLEET.get(env.FLEET.idFromName("fleet"));

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

const hmac = async (key: string, message: string) => {
  const k = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", k, encoder.encode(message)));
};

// Each box's key is derived from one master secret; `bun run fleet:key <host>` prints it.
export const hostKey = (secret: string, host: string) =>
  hmac(secret, `fleet:${host}`);

// Workers' SubtleCrypto has timingSafeEqual; the DOM lib doesn't know.
const subtle = crypto.subtle as SubtleCrypto & {
  timingSafeEqual: (a: BufferSource, b: BufferSource) => boolean;
};
const same = (a: string, b: string) =>
  a.length === b.length &&
  subtle.timingSafeEqual(encoder.encode(a), encoder.encode(b));

export type Verified =
  | { ok: true; host: string; sample: Sample; ts: number }
  | { ok: false; status: number };

export async function verify(request: Request): Promise<Verified> {
  const host = request.headers.get("x-fleet-host") ?? "";
  const ts = Number(request.headers.get("x-fleet-ts"));
  const sig = request.headers.get("x-fleet-sig") ?? "";
  if (
    !(host in HOSTS) ||
    !Number.isInteger(ts) ||
    !/^[0-9a-f]{64}$/.test(sig)
  ) {
    return { ok: false, status: 400 };
  }
  if (Math.abs(Date.now() / 1000 - ts) > SKEW_S) {
    return { ok: false, status: 401 };
  }
  const body = await request.text();
  if (body.length > MAX_BODY) {
    return { ok: false, status: 413 };
  }
  const key = await hostKey(env.FLEET_SECRET, host);
  if (!same(await hmac(key, `${ts}.${body}`), sig)) {
    return { ok: false, status: 401 };
  }
  const sample = parse(body);
  return sample
    ? { ok: true, host, sample, ts: ts * 1000 }
    : { ok: false, status: 400 };
}

const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const pair = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every(num);

const parse = (text: string): Sample | null => {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const { boot, containers, cpu, cpus, disk, load, mem, os } = raw;
  if (
    !(num(boot) && num(cpu) && num(cpus) && pair(disk) && pair(mem)) ||
    !(Array.isArray(load) && load.length === 3 && load.every(num)) ||
    typeof os !== "string"
  ) {
    return null;
  }
  const list = Array.isArray(containers)
    ? containers.flatMap((c) =>
        c && typeof c.n === "string" && typeof c.s === "string"
          ? [{ n: c.n, s: c.s, m: num(c.m) ? c.m : undefined }]
          : []
      )
    : Array.from({ length: num(containers) ? containers : 0 }, () => ({
        n: "",
        s: "",
      }));
  return {
    boot,
    containers: list,
    cpu: Math.round(cpu),
    cpus,
    disk,
    load: load as [number, number, number],
    mem,
    os: os.slice(0, 32),
  };
};
