import { env } from "cloudflare:workers";
import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
} from "obscenity";
import { resolveSiteInfo } from "@/lib/site";

// The Room DO lives in the `www-room` worker; nothing to talk to under `vite dev`.
export const room = () =>
  import.meta.env.DEV || !env.ROOM
    ? null
    : env.ROOM.get(env.ROOM.idFromName("site"));

const BOT_RE =
  /bot|crawl|spider|slurp|preview|fetch|curl|wget|headless|lighthouse|monitor/i;

export const isBot = (request: Request) =>
  BOT_RE.test(request.headers.get("user-agent") ?? "");

// Preview URLs share the production Room; don't let them write to it.
export const isPreview = (request: Request) =>
  !resolveSiteInfo(request).isPublicHost;

export const limited = async (request: Request, scope: string) => {
  const ip = request.headers.get("cf-connecting-ip");
  if (!(env.RATE_LIMIT && ip)) {
    return false;
  }
  const { success } = await env.RATE_LIMIT.limit({ key: `${scope}:${ip}` });
  return !success;
};

const profanity = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const PUNCTUATION_RE = /[^\p{L}\p{N}\s]/gu;

export const isRude = (text: string) =>
  profanity.hasMatch(text) ||
  profanity.hasMatch(text.replace(PUNCTUATION_RE, ""));

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const incoming = (
  cf: CfProperties | undefined
): cf is IncomingRequestCfProperties => Boolean(cf && "country" in cf);

const plain = (name: string) =>
  name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const INDIAN_METROS = new Set([
  "bengaluru",
  "mumbai",
  "delhi",
  "new delhi",
  "hyderabad",
  "chennai",
  "kolkata",
  "pune",
  "ahmedabad",
  "jaipur",
  "lucknow",
  "chandigarh",
  "kochi",
  "gurugram",
  "noida",
  "indore",
  "bhopal",
  "surat",
  "nagpur",
  "coimbatore",
]);

export const placeOf = (request: Request) => {
  const cf = incoming(request.cf) ? request.cf : undefined;
  const country = cf?.country ?? request.headers.get("cf-ipcountry");
  const city = cf?.city ?? request.headers.get("cf-ipcity");
  const place =
    country === "IN" && city && !INDIAN_METROS.has(plain(city))
      ? (cf?.region ?? city)
      : city;
  if (place) {
    return plain(place);
  }
  if (!country || country === "XX" || country === "T1") {
    return "somewhere";
  }
  try {
    return (regionNames.of(country) ?? "somewhere").toLowerCase();
  } catch {
    return "somewhere";
  }
};

export const ipHash = async (request: Request) => {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) {
    return null;
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`www:${ip}`)
  );
  return Array.from(new Uint8Array(digest, 0, 12), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
};
