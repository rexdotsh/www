import GithubSlugger from "github-slugger";
import paraboxBody from "@/content/parabox.md?raw";
import { type PostMeta, POSTS_META } from "@/lib/posts-meta";

const BODIES: Record<string, string> = {
  parabox: paraboxBody,
};

export interface BlogPost extends PostMeta {
  body: string;
  readingMinutes: number;
}

export const BLOG_POSTS: BlogPost[] = POSTS_META.map((meta) => {
  const body = BODIES[meta.slug] ?? "";
  return {
    ...meta,
    body,
    readingMinutes: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
  };
});

export const PUBLISHED_POSTS = BLOG_POSTS.filter((post) => !post.draft);

export const getPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);

export interface TocEntry {
  depth: 2 | 3;
  id: string;
  text: string;
}

export function getToc(body: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    const match = inFence ? null : /^(#{2,4})\s+(.+)$/.exec(line);
    if (!match) {
      continue;
    }
    // every heading feeds the slugger so ids stay in sync with rehype-slug
    const id = slugger.slug(match[2]);
    const depth = match[1].length;
    if (depth < 4) {
      entries.push({ depth: depth as 2 | 3, id, text: match[2].toLowerCase() });
    }
  }
  return entries;
}
