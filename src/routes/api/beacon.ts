import { createFileRoute } from "@tanstack/react-router";
import { waitUntil } from "cloudflare:workers";
import { PUBLISHED_META } from "@/lib/posts-meta";
import { type Beacon, VISITOR_RE } from "@/lib/stats";
import {
  isBot,
  isCrossSite,
  isPreview,
  limited,
  notAllowed,
  placeOf,
  room,
  tooLarge,
} from "@/server/api";

const MAX_BODY = 512;
const PATHS = new Set([
  "/",
  "/blog",
  "/status",
  ...PUBLISHED_META.map((post) => `/blog/${post.slug}`),
]);

const parse = (raw: unknown): Beacon | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const { type, path, visitor, depth, seconds } = raw as Record<
    string,
    unknown
  >;
  if (typeof visitor !== "string" || !VISITOR_RE.test(visitor)) {
    return null;
  }
  if (type === "hi") {
    return { type, visitor };
  }
  if (typeof path !== "string" || !PATHS.has(path)) {
    return null;
  }
  if (type === "view") {
    return { type, path, visitor };
  }
  if (
    type === "leave" &&
    typeof depth === "number" &&
    typeof seconds === "number"
  ) {
    return { type, path, visitor, depth, seconds };
  }
  return null;
};

export const Route = createFileRoute("/api/beacon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stub = room();
        if (
          !stub ||
          isBot(request) ||
          isPreview(request) ||
          isCrossSite(request)
        ) {
          return new Response(null, { status: 204 });
        }
        if (tooLarge(request, MAX_BODY)) {
          return new Response(null, { status: 413 });
        }
        if (await limited(request, "beacon")) {
          return new Response(null, { status: 429 });
        }
        const text = await request.text();
        if (text.length > MAX_BODY) {
          return new Response(null, { status: 413 });
        }
        let beacon: Beacon | null = null;
        try {
          beacon = parse(JSON.parse(text));
        } catch {
          beacon = null;
        }
        if (!beacon) {
          return new Response(null, { status: 400 });
        }
        // Beacons fire as the page goes away; don't let the visitor leaving cancel the write.
        waitUntil(
          stub
            .record(beacon, placeOf(request))
            .catch((error) => console.error("beacon", error))
        );
        return new Response(null, { status: 204 });
      },
      ANY: notAllowed("POST"),
    },
  },
});
