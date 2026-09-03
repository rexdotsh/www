export interface PostMeta {
  date: string;
  dateLabel: string;
  description: string;
  draft?: boolean;
  meta: string[];
  readingMinutes: number;
  slug: string;
  title: string;
}

export const POSTS_META: PostMeta[] = [
  {
    slug: "parabox",
    title: "gpn ctf 2024 – parabox",
    date: "2024-11-27",
    dateLabel: "nov 27, 2024",
    description: "a gameboy reverse engineering challenge.",
    meta: ["reverse engineering", "500 pts", "1 solve"],
    readingMinutes: 9,
  },
];

export const PUBLISHED_META = POSTS_META.filter((post) => !post.draft);

export const getPostMeta = (slug: string) =>
  POSTS_META.find((post) => post.slug === slug);
