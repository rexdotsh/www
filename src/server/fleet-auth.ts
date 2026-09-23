import { env } from "cloudflare:workers";
import { HOSTS, hmac, hostKey, type Sample } from "@/lib/fleet";

const SKEW_S = 300;
const MAX_BODY = 16 * 1024;
const SIG_RE = /^[0-9a-f]{64}$/;

export const fleet = () =>
  import.meta.env.DEV || !env.FLEET
    ? null
    : env.FLEET.get(env.FLEET.idFromName("fleet"));

const enc = new TextEncoder();

// FLEET_SECRET is fixed per deploy, so a box's derived key can live as long as the isolate.
const keys = new Map<string, Promise<string>>();

// Workers' SubtleCrypto has timingSafeEqual; the DOM lib doesn't know.
const subtle = crypto.subtle as SubtleCrypto & {
  timingSafeEqual: (a: BufferSource, b: BufferSource) => boolean;
};

type Verified =
  | { ok: true; host: string; sample: Sample; ts: number }
  | { ok: false; status: number };

export async function verify(request: Request): Promise<Verified> {
  if (!env.FLEET_SECRET) return { ok: false, status: 503 };
  const host = request.headers.get("x-fleet-host") ?? "";
  const ts = Number(request.headers.get("x-fleet-ts"));
  const sig = request.headers.get("x-fleet-sig") ?? "";
  if (!(host in HOSTS && Number.isInteger(ts) && SIG_RE.test(sig)))
    return { ok: false, status: 400 };
  if (Math.abs(Date.now() / 1000 - ts) > SKEW_S)
    return { ok: false, status: 401 };
  if (Number(request.headers.get("content-length")) > MAX_BODY)
    return { ok: false, status: 413 };
  const body = await request.text();
  if (body.length > MAX_BODY) return { ok: false, status: 413 };
  const key = keys.get(host) ?? hostKey(env.FLEET_SECRET, host);
  keys.set(host, key);
  const expected = await hmac(await key, `${ts}.${body}`);
  if (!subtle.timingSafeEqual(enc.encode(expected), enc.encode(sig)))
    return { ok: false, status: 401 };
  const sample = parse(body);
  return sample
    ? { ok: true, host, sample, ts: ts * 1000 }
    : { ok: false, status: 400 };
}

const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const nums = (v: unknown, n: number): v is number[] =>
  Array.isArray(v) && v.length === n && v.every(num);

const parse = (text: string): Sample | null => {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const { boot, containers, cpu, cpus, disk, load, mem, os } = raw;
  if (
    !(
      num(boot) &&
      num(cpu) &&
      num(cpus) &&
      nums(disk, 2) &&
      nums(mem, 2) &&
      nums(load, 3) &&
      typeof os === "string"
    )
  ) {
    return null;
  }
  // `containers` is a list, or just a count from boxes that keep names to themselves.
  const list = Array.isArray(containers)
    ? containers.flatMap((c) =>
        typeof c?.n === "string" && typeof c.s === "string"
          ? [{ n: c.n, s: c.s, m: num(c.m) ? c.m : undefined }]
          : []
      )
    : new Array(num(containers) ? containers : 0).fill({
        n: "",
        s: "",
      });
  return {
    boot,
    containers: list,
    cpu: Math.round(cpu),
    cpus,
    disk: disk as [number, number],
    load: load as [number, number, number],
    mem: mem as [number, number],
    os: os.slice(0, 32),
  };
};
