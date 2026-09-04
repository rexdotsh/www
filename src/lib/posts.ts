import type { MDXContent } from "mdx/types";
import ParaboxContent, {
  type MdxTocNode,
  readingTime as paraboxReadingTime,
  tableOfContents as paraboxToc,
} from "@/content/parabox.mdx";
import { type PostMeta, POSTS_META } from "@/lib/posts-meta";

type TocDepth = 2 | 3 | 4;

export interface TocEntry {
  depth: TocDepth;
  id: string;
  parent?: string;
  text: string;
}

// Flatten headings while retaining each h4's parent h3.
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

const POSTS: (PostMeta & PostContent)[] = POSTS_META.map((meta) => ({
  ...meta,
  ...(CONTENT[meta.slug] ?? {
    Content: (() => null) as MDXContent,
    readingMinutes: 1,
    toc: [],
  }),
}));

export const getPost = (slug: string) =>
  POSTS.find((post) => post.slug === slug);
