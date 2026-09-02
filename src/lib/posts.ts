import type { MDXContent } from "mdx/types";
import ParaboxContent, {
  type MdxTocNode,
  readingTime as paraboxReadingTime,
  tableOfContents as paraboxToc,
} from "@/content/parabox.mdx";
import { type PostMeta, POSTS_META } from "@/lib/posts-meta";

export type TocDepth = 2 | 3 | 4;

export interface TocEntry {
  depth: TocDepth;
  id: string;
  // h4s know their h3, so the contents can show them only inside that section
  parent?: string;
  text: string;
}

// h2 through h4; anything deeper is body structure, not wayfinding.
// text mirrors the heading as written, so headings are the place to set case
const flattenToc = (nodes: MdxTocNode[], parent?: string): TocEntry[] =>
  nodes.flatMap((node) => {
    const entry: TocEntry[] =
      node.id && node.depth >= 2 && node.depth <= 4
        ? [
            {
              depth: node.depth as TocDepth,
              id: node.id,
              parent: node.depth === 4 ? parent : undefined,
              text: node.value,
            },
          ]
        : [];
    const nextParent = node.depth === 3 && node.id ? node.id : parent;
    return [...entry, ...flattenToc(node.children ?? [], nextParent)];
  });

interface PostContent {
  Content: MDXContent;
  readingMinutes: number;
  toc: TocEntry[];
}

const CONTENT: Record<string, PostContent> = {
  parabox: {
    Content: ParaboxContent,
    readingMinutes: Math.max(1, Math.round(paraboxReadingTime.minutes)),
    toc: flattenToc(paraboxToc),
  },
};

export interface BlogPost extends PostMeta, PostContent {}

export const BLOG_POSTS: BlogPost[] = POSTS_META.map((meta) => ({
  ...meta,
  ...(CONTENT[meta.slug] ?? {
    Content: (() => null) as MDXContent,
    readingMinutes: 1,
    toc: [],
  }),
}));

export const getPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);
