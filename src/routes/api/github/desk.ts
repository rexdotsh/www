import { createFileRoute } from "@tanstack/react-router";
import { parseActivity, parseRepositories } from "@/lib/github";

export const Route = createFileRoute("/api/github/desk")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const signal = AbortSignal.any([
          request.signal,
          AbortSignal.timeout(6000),
        ]);
        const load = async (path: string) => {
          const response = await fetch(
            `https://api.github.com/users/rexdotsh/${path}`,
            {
              headers: {
                Accept: "application/vnd.github+json",
                "User-Agent": "rex.wf personal portfolio",
                "X-GitHub-Api-Version": "2022-11-28",
              },
              signal,
            }
          );
          if (!response.ok)
            throw new Error(`GitHub returned ${response.status}`);
          return response.json();
        };
        const [repositories, activity] = await Promise.allSettled([
          load("repos?per_page=100&sort=updated"),
          load("events/public?per_page=30"),
        ]);
        if (
          repositories.status === "rejected" &&
          activity.status === "rejected"
        ) {
          return Response.json(
            { error: "GitHub is taking a moment." },
            { status: 502, headers: { "Cache-Control": "no-store" } }
          );
        }
        return Response.json(
          {
            repositories:
              repositories.status === "fulfilled"
                ? parseRepositories(repositories.value)
                : [],
            activity:
              activity.status === "fulfilled"
                ? parseActivity(activity.value)
                : [],
          },
          {
            headers: {
              "Cache-Control": "public, max-age=900",
              "Cloudflare-CDN-Cache-Control":
                "public, max-age=1800, stale-while-revalidate=86400",
            },
          }
        );
      },
    },
  },
});
