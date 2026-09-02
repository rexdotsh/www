import type { MDXContent } from "mdx/types";
import ParaboxContent, {
  type MdxTocNode,
  readingTime as paraboxReadingTime,
  tableOfContents as paraboxToc,
} from "@/content/parabox.mdx";
import { type PostMeta, POSTS_META } from "@/lib/posts-meta";

export interface TocEntry {
  depth: 2 | 3;
  id: string;
  text: string;
}

const flattenToc = (nodes: MdxTocNode[]): TocEntry[] =>
  nodes.flatMap((node) => {
    const entry: TocEntry[] =
      node.id && node.depth < 4
        ? [
            {
              depth: node.depth as 2 | 3,
              id: node.id,
              text: node.value.toLowerCase(),
            },
          ]
        : [];
    return [...entry, ...flattenToc(node.children ?? [])];
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
