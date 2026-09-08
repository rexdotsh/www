import { createFileRoute } from "@tanstack/react-router";

const SOURCE = "https://github.com/users/rexdotsh/contributions";
const DAY_TAG_RE = /<[^>]*data-date="\d{4}-\d{2}-\d{2}"[^>]*>/g;
const DATE_RE = /data-date="(\d{4}-\d{2}-\d{2})"/;
const LEVEL_RE = /data-level="([0-4])"/;
const TOTAL_RE = /([\d,]+)\s+contributions?\s+in the last year/;
const DAY_MS = 86_400_000;
const GITHUB_TIMEOUT_MS = 5000;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600",
  "Cloudflare-CDN-Cache-Control":
    "public, max-age=21600, stale-while-revalidate=86400",
};

function parse(html: string) {
  const days = new Map<string, number>();
  for (const [tag] of html.matchAll(DAY_TAG_RE)) {
    const date = DATE_RE.exec(tag)?.[1];
    const level = LEVEL_RE.exec(tag)?.[1];
    if (date && level) {
      days.set(date, Number(level));
    }
  }

  const totalMatch = TOTAL_RE.exec(html)?.[1];
  if (days.size < 365 || !totalMatch) {
    return null;
  }

  const sorted = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));
  const weeks: number[][] = [];
  let previousDate = 0;
  for (const [date, level] of sorted) {
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (
      !Number.isFinite(timestamp) ||
      (previousDate && timestamp - previousDate !== DAY_MS)
    ) {
      return null;
    }
    previousDate = timestamp;

    const day = new Date(timestamp).getUTCDay();
    if (day === 0 || weeks.length === 0) {
      weeks.push(new Array<number>(7).fill(-1));
    }
    const currentWeek = weeks.at(-1);
    if (!currentWeek) {
      return null;
    }
    currentWeek[day] = level;
  }

  const total = Number(totalMatch.replaceAll(",", ""));
  return { total, weeks };
}

export const Route = createFileRoute("/api/github/contributions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const response = await fetch(SOURCE, {
            headers: {
              Accept: "text/html",
              "Accept-Language": "en-US",
              "User-Agent": "rex.wf contributions widget (https://rex.wf)",
            },
            signal: AbortSignal.any([
              request.signal,
              AbortSignal.timeout(GITHUB_TIMEOUT_MS),
            ]),
          });
          if (!response.ok) {
            throw new Error(`GitHub returned ${response.status}`);
          }

          const data = parse(await response.text());
          if (!data) {
            throw new Error(
              "GitHub returned an unrecognized contributions page"
            );
          }

          return Response.json(data, {
            headers: CACHE_HEADERS,
          });
        } catch (error) {
          console.error("Failed to fetch GitHub contributions:", error);
          return Response.json(
            { error: "Failed to fetch GitHub contributions" },
            {
              status: 502,
              headers: { "Cache-Control": "no-store" },
            }
          );
        }
      },
    },
  },
});
