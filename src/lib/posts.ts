import paraboxBody from "@/content/parabox.md?raw";

export interface BlogPost {
  body: string;
  date: string;
  dateLabel: string;
  description: string;
  meta: string[];
  slug: string;
  title: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "parabox",
    title: "gpn ctf 2024 – parabox",
    date: "2024-11-27",
    dateLabel: "nov 27, 2024",
    description: "a gameboy reverse engineering challenge with one solve.",
    meta: ["reverse engineering", "500 pts", "1 solve"],
    body: paraboxBody,
  },
];

export const getPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);
