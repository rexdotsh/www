import { createFileRoute } from "@tanstack/react-router";

const SOURCE = "https://github.com/users/rexdotsh/contributions";
const DAY_RE = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
const LEVEL_FIRST_RE = /data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g;
const TOTAL_RE = /([\d,]+)\s+contributions?\s+in the last year/;

/** parses github's public contributions fragment into a 7-row week grid */
function parse(html: string) {
  const days = new Map<string, number>();
  for (const match of html.matchAll(DAY_RE)) {
    days.set(match[1], Number(match[2]));
  }
  for (const match of html.matchAll(LEVEL_FIRST_RE)) {
    days.set(match[2], Number(match[1]));
  }
  if (days.size === 0) {
    return null;
  }

  const sorted = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  const weeks: number[][] = [];
  for (const [date, level] of sorted) {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (day === 0 || weeks.length === 0) {
      weeks.push(new Array<number>(7).fill(-1));
    }
    weeks.at(-1)?.splice(day, 1, level);
  }

  const total = Number(TOTAL_RE.exec(html)?.[1]?.replaceAll(",", "") ?? 0);
  return { total, weeks };
}

export const Route = createFileRoute("/api/github/contributions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const response = await fetch(SOURCE, {
            headers: { "User-Agent": "rex.wf (contributions widget)" },
            signal: request.signal,
          });
          if (!response.ok) {
            throw new Error(`github said ${response.status}`);
          }
          const data = parse(await response.text());
          return Response.json(data, {
            headers: {
              "Cache-Control": "public, max-age=3600",
              "Cloudflare-CDN-Cache-Control":
                "public, max-age=21600, stale-while-revalidate=86400",
            },
          });
        } catch {
          return Response.json(null, {
            headers: { "Cache-Control": "no-store" },
          });
        }
      },
    },
  },
});
