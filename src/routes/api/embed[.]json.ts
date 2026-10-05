import { createFileRoute } from "@tanstack/react-router";
import { homeEmbed, postEmbed } from "@/lib/discord-embed";
import { getPost } from "@/lib/posts";
import { resolveSiteInfo } from "@/lib/site";
import { getNowPlaying } from "@/lib/spotify";
import { getAccessToken } from "@/lib/spotify-auth";
import { ogImageUrl } from "@/lib/utils";
import { notAllowed } from "@/server/api";

export const Route = createFileRoute("/api/embed.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { baseUrl, hostname } = resolveSiteInfo(request);
        const slug = new URL(request.url).searchParams.get("post");
        if (slug !== null) {
          const post = getPost(slug);
          if (!post) {
            return new Response(null, { status: 404 });
          }
          return Response.json(
            postEmbed(baseUrl, ogImageUrl(`/og/${slug}.png`, baseUrl), post),
            {
              headers: {
                "Cache-Control": "public, max-age=3600",
                "Cloudflare-CDN-Cache-Control": "public, max-age=86400",
              },
            }
          );
        }
        const signal = AbortSignal.timeout(2500);
        const track = await getAccessToken(signal)
          .then((token) => getNowPlaying(token, signal))
          .catch(() => null);
        return Response.json(homeEmbed(baseUrl, hostname, track), {
          headers: {
            "Cache-Control": "public, max-age=30",
            "Cloudflare-CDN-Cache-Control": "public, max-age=60",
          },
        });
      },
      ANY: notAllowed("GET"),
    },
  },
});
