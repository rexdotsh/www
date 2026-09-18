import { getIdentity, LINKS } from "@/lib/content";
import type { TocEntry } from "@/lib/posts";
import type { PostMeta } from "@/lib/posts-meta";
import type { NowPlaying } from "@/lib/spotify";
import { compact, type SiteStats } from "@/lib/stats";

// Discord component embeds: a read-only Components v2 layout that replaces the
// Open Graph card when a link is unfurled. Only the component types below are
// allowed and buttons must be link-style.
// https://github.com/discord/discord-api-docs/pull/8606

export const EMBED_REL = "discord:component-embed";

// --rose (light) as an integer
const ROSE = 0xb3_12_3a;

const T = {
  ActionRow: 1,
  Button: 2,
  Section: 9,
  Text: 10,
  Thumbnail: 11,
  Gallery: 12,
  Separator: 14,
  Container: 17,
} as const;

interface Media {
  url: string;
}

interface Button {
  label: string;
  style: 5;
  type: typeof T.Button;
  url: string;
}

interface Text {
  content: string;
  type: typeof T.Text;
}

interface Thumbnail {
  description?: string;
  media: Media;
  type: typeof T.Thumbnail;
}

type Child =
  | { type: typeof T.ActionRow; components: Button[] }
  | {
      type: typeof T.Section;
      components: Text[];
      accessory: Thumbnail | Button;
    }
  | Text
  | {
      type: typeof T.Gallery;
      items: Array<{ media: Media; description?: string }>;
    }
  | { type: typeof T.Separator; divider?: boolean; spacing?: 1 | 2 };

export interface ComponentEmbed {
  component: {
    type: typeof T.Container;
    accent_color: number;
    components: Child[];
  };
}

const text = (content: string): Text => ({ type: T.Text, content });
const link = (label: string, url: string): Button => ({
  type: T.Button,
  style: 5,
  url,
  label,
});
const thumb = (url: string, description?: string): Thumbnail => ({
  type: T.Thumbnail,
  media: { url },
  description,
});
const section = (content: string, accessory: Thumbnail | Button): Child => ({
  type: T.Section,
  components: [text(content)],
  accessory,
});
const row = (...buttons: Button[]): Child => ({
  type: T.ActionRow,
  components: buttons,
});
const gallery = (url: string, description?: string): Child => ({
  type: T.Gallery,
  items: [{ media: { url }, description }],
});
const rule: Child = { type: T.Separator };

const container = (components: Child[]): ComponentEmbed => ({
  component: { type: T.Container, accent_color: ROSE, components },
});

// Visitor-written text ends up inside Discord markdown; neutralise it.
const MARKDOWN_RE = /[\\*_~`|>[\]#-]/g;
const plain = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(MARKDOWN_RE, "\\$&")
    .replaceAll("@", "@\u200b")
    .trim();

const albumArt = (track: NowPlaying) =>
  track.image.find((img) => img.size === "medium")?.["#text"] ??
  track.image[0]?.["#text"];

export function homeEmbed({
  baseUrl,
  hostname,
  stats,
  track,
}: {
  baseUrl: string;
  hostname: string;
  stats: SiteStats | null;
  track: NowPlaying | null;
}): ComponentEmbed {
  const identity = getIdentity(hostname);
  const blog = new URL(LINKS.blog, baseUrl).href;
  const something = track ? `[something](${track.url})` : "something";
  const parts: Child[] = [
    section(
      `# hi, i'm ${identity.name}.\ni [build things](${LINKS.github}), i [write](${blog}) about some of them, share a [workshop](${LINKS.flora}) with friends, and usually have ${something} on. say [hi back](${LINKS.twitter}).`,
      thumb(new URL("/image.png", baseUrl).href, "a rose")
    ),
  ];

  if (track) {
    const art = albumArt(track);
    const body = `-# ♪ ${track.isPlaying ? "now playing" : "last played"}\n**[${plain(track.name)}](${track.url})**\n${plain(track.artist)}`;
    parts.push(
      rule,
      art
        ? section(body, thumb(art, plain(track.album)))
        : section(body, link("listen", track.url))
    );
  }

  if (stats) {
    const lines = [
      `${stats.online} here now · ${stats.today} today · ${compact(stats.total)} all time`,
    ];
    if (stats.hi > 0) {
      lines.push(
        `${stats.hi === 1 ? "one person" : `${stats.hi} people`} said hi this month`
      );
    }
    const [latest] = stats.guestbook;
    if (latest) {
      lines.push(
        `> ${plain(latest.message)}\n> — ${plain(latest.name)}, from ${plain(latest.place)} · ${latest.ago} ago`
      );
    }
    parts.push(rule, text(lines.join("\n")));
  }

  parts.push(
    row(
      link("github", LINKS.github),
      link("x", LINKS.twitter),
      link("writing", blog),
      link(identity.otherDomain.replace("https://", ""), identity.otherDomain)
    )
  );

  return container(parts);
}

const TOC_MAX = 10;

export function postEmbed({
  baseUrl,
  imageUrl,
  post,
  readingMinutes,
  toc,
}: {
  baseUrl: string;
  imageUrl: string;
  post: Pick<PostMeta, "dateLabel" | "description" | "meta" | "slug" | "title">;
  readingMinutes: number;
  toc: TocEntry[];
}): ComponentEmbed {
  const url = `${baseUrl}/blog/${post.slug}`;
  const blog = new URL(LINKS.blog, baseUrl).href;
  const meta = [post.dateLabel, ...post.meta, `${readingMinutes} min read`];
  const parts: Child[] = [
    gallery(imageUrl, post.title),
    text(
      `# [${post.title}](${url})\n${post.description}\n-# ${meta.join(" · ")}`
    ),
  ];

  const headings = toc.filter((entry) => entry.depth < 4).slice(0, TOC_MAX);
  if (headings.length > 0) {
    const items = headings.map(
      (entry) =>
        `${entry.depth === 3 ? "  " : ""}- [${entry.text}](${url}#${entry.id})`
    );
    if (toc.length > headings.length) {
      items.push("- …");
    }
    parts.push(rule, text(`**contents**\n${items.join("\n")}`));
  }

  parts.push(row(link("read", url), link("more writing", blog)));
  return container(parts);
}
