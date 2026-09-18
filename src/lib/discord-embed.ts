import { getIdentity, LINKS } from "@/lib/content";
import type { getPost } from "@/lib/posts";
import type { NowPlaying } from "@/lib/spotify";

// https://github.com/discord/discord-api-docs/pull/8606
export const EMBED_REL = "discord:component-embed";

type Component = Record<string, unknown>;

const text = (content: string) => ({ type: 10, content });
const link = (label: string, url: string) => ({
  type: 2,
  style: 5,
  url,
  label,
});
const thumb = (url: string) => ({ type: 11, media: { url } });
const section = (content: string, accessory: Component) => ({
  type: 9,
  components: [text(content)],
  accessory,
});
const row = (...components: Component[]) => ({ type: 1, components });
const gallery = (url: string) => ({ type: 12, items: [{ media: { url } }] });
const rule = { type: 14 };
const container = (components: Component[]) => ({
  component: { type: 17, accent_color: 0xb3_12_3a, components },
});

export function homeEmbed(
  baseUrl: string,
  hostname: string,
  track: NowPlaying | null
) {
  const identity = getIdentity(hostname);
  const blog = new URL(LINKS.blog, baseUrl).href;
  const something = track ? `[something](${track.url})` : "something";
  return container([
    section(
      `# hi, i'm ${identity.name}.\ni [build things](${LINKS.github}), i [write](${blog}) about some of them, share a [workshop](${LINKS.flora}) with friends, and usually have ${something} on. say [hi back](${LINKS.twitter}).`,
      thumb(new URL("/image.png", baseUrl).href)
    ),
    row(
      link("github", LINKS.github),
      link("x", LINKS.twitter),
      link("writing", blog),
      link(identity.otherDomain.replace("https://", ""), identity.otherDomain)
    ),
  ]);
}

export function postEmbed(
  baseUrl: string,
  imageUrl: string,
  post: NonNullable<ReturnType<typeof getPost>>
) {
  const url = `${baseUrl}/blog/${post.slug}`;
  const meta = [
    post.dateLabel,
    ...post.meta,
    `${post.readingMinutes} min read`,
  ];
  const toc = post.toc
    .filter((entry) => entry.depth < 4)
    .slice(0, 10)
    .map(
      (entry) =>
        `${entry.depth === 3 ? "  " : ""}- [${entry.text}](${url}#${entry.id})`
    );
  return container([
    gallery(imageUrl),
    text(
      `# [${post.title}](${url})\n${post.description}\n-# ${meta.join(" · ")}`
    ),
    ...(toc.length > 0 ? [rule, text(`**contents**\n${toc.join("\n")}`)] : []),
    row(
      link("read", url),
      link("more writing", new URL(LINKS.blog, baseUrl).href)
    ),
  ]);
}
