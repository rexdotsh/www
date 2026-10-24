declare module "*.mdx" {
  import type { MDXContent } from "mdx/types";

  export interface MdxTocNode {
    children?: MdxTocNode[];
    depth: number;
    id?: string;
    value: string;
  }

  export const tableOfContents: MdxTocNode[];
  export const readingTime: {
    minutes: number;
    text: string;
    time: number;
    words: number;
  };

  const Content: MDXContent;
  export default Content;
}

// Viewport Segments API: shipped in Chromium, behind a flag in Safari 27.1.
interface Window {
  readonly viewport?: { readonly segments: readonly DOMRect[] | null };
}

// bun's file loader hands back the resolved path
declare module "*.woff" {
  const path: string;
  export default path;
}
