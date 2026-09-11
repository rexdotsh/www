import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { GUESTBOOK_LIMITS, VISITOR_RE } from "@/lib/stats";
import {
  ipHash,
  isBot,
  isPreview,
  isRude,
  limited,
  placeOf,
  room,
} from "@/server/api";

const MAX_BODY = 1024;
// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
const CONTROL_RE = /[\u0000-\u001f\u007f]/g;

const clean = (value: unknown, max: number) =>
  typeof value === "string"
    ? value
        .replace(CONTROL_RE, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .slice(0, max)
    : "";

export const Route = createFileRoute("/api/guestbook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stub = room();
        if (!stub) {
          return new Response(null, { status: 503 });
        }
        if (isBot(request) || isPreview(request)) {
          return new Response(null, { status: 403 });
        }
        if (await limited(request, "guestbook")) {
          return Response.json(
            { ok: false, reason: "cooldown" },
            { status: 429 }
          );
        }
        const text = await request.text();
        if (text.length > MAX_BODY) {
          return new Response(null, { status: 413 });
        }
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          return new Response(null, { status: 400 });
        }
        const { visitor } = body;
        const message = clean(body.message, GUESTBOOK_LIMITS.message);
        const name = clean(body.name, GUESTBOOK_LIMITS.name);
        if (
          !(typeof visitor === "string" && VISITOR_RE.test(visitor) && message)
        ) {
          return Response.json({ ok: false, reason: "empty" }, { status: 400 });
        }
        if (isRude(message) || isRude(name)) {
          return Response.json({ ok: false, reason: "rude" }, { status: 422 });
        }
        const hash = await ipHash(request);
        try {
          const result = await stub.sign({
            name,
            message,
            city: placeOf(request),
            who: hash ? [visitor, hash] : [visitor],
          });
          return Response.json(result, { status: result.ok ? 201 : 429 });
        } catch (error) {
          console.error("guestbook", error);
          return new Response(null, { status: 503 });
        }
      },

      DELETE: async ({ request }) => {
        const token = env.GUESTBOOK_ADMIN_TOKEN;
        if (
          !token ||
          request.headers.get("authorization") !== `Bearer ${token}`
        ) {
          return new Response(null, { status: 401 });
        }
        const id = Number(new URL(request.url).searchParams.get("id"));
        const stub = room();
        if (!(stub && Number.isInteger(id) && id > 0)) {
          return new Response(null, { status: 400 });
        }
        await stub.hide(id);
        return new Response(null, { status: 204 });
      },
    },
  },
});
