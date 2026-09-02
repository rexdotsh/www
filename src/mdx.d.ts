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
