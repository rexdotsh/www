export interface SiteIdentity {
  handle: string;
  name: string;
  tagline: string;
}

export function getIdentity(hostname: string): SiteIdentity {
  const isMridul = hostname === "mridul.sh";
  return {
    name: isMridul ? "mridul" : "rex",
    handle: isMridul ? "mridul" : "rexmkv",
    tagline: "building things on the internet",
  };
}

export interface NavLink {
  href: string;
  label: string;
}

export function getNavLinks(hostname: string): NavLink[] {
  return [
    { href: "https://blog.rex.wf", label: "blog" },
    ...(hostname === "mridul.sh"
      ? [{ href: "/resume", label: "resume" }]
      : [{ href: "https://x.com/rexmkv", label: "twitter" }]),
    { href: "https://github.com/rexdotsh", label: "github" },
    { href: "https://floraorg.github.io", label: "flora" },
  ];
}

export interface Project {
  description: string;
  href: string;
  language: string;
  name: string;
  year: string;
}

/** real repos, pulled from github.com/rexdotsh — swap/trim as needed */
export const PROJECTS: Project[] = [
  {
    name: "kleis",
    description: "opencode-first oauth proxy for coding agents",
    href: "https://github.com/rexdotsh/kleis",
    language: "typescript",
    year: "2026",
  },
  {
    name: "flora",
    description: "an open canvas for images, built with friends",
    href: "https://floraorg.github.io",
    language: "typescript",
    year: "2025",
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 bucket enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
    language: "go",
    year: "2025",
  },
  {
    name: "opensrc",
    description: "npm package source for ai coding agents",
    href: "https://github.com/rexdotsh/opensrc",
    language: "typescript",
    year: "2026",
  },
  {
    name: "gh-secrets-cli",
    description: "manage github actions secrets from env files",
    href: "https://github.com/rexdotsh/gh-secrets-cli",
    language: "typescript",
    year: "2025",
  },
  {
    name: "www",
    description: "this website, in five moods",
    href: "https://github.com/rexdotsh/www",
    language: "typescript",
    year: "2026",
  },
];

export interface Post {
  date: string;
  href: string;
  title: string;
}

/** placeholders — port real posts from blog.rex.wf when wiring up */
export const POSTS: Post[] = [
  {
    title: "coding agents, six months in",
    date: "2026-08",
    href: "https://blog.rex.wf",
  },
  {
    title: "notes on self-hosting everything",
    date: "2026-05",
    href: "https://blog.rex.wf",
  },
  {
    title: "the case for tiny websites",
    date: "2026-02",
    href: "https://blog.rex.wf",
  },
];
