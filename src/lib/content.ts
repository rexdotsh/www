export interface SiteIdentity {
  domain: string;
  handle: string;
  isMridul: boolean;
  name: string;
  otherDomain: string;
  otherName: string;
}

export function getIdentity(hostname: string): SiteIdentity {
  const isMridul = hostname === "mridul.sh";
  return {
    name: isMridul ? "mridul" : "rex",
    otherName: isMridul ? "rex" : "mridul",
    domain: isMridul ? "mridul.sh" : "rex.wf",
    otherDomain: isMridul ? "https://rex.wf" : "https://mridul.sh",
    handle: "rexmkv",
    isMridul,
  };
}

export const LINKS = {
  email: "mailto:hey@mridul.sh",
  archive: "https://github.com/rexdotsh/ctf-writeups",
  blog: "/blog",
  flora: "https://floraorg.github.io",
  github: "https://github.com/rexdotsh",
  twitter: "https://x.com/rexmkv",
};

export const PROJECTS = [
  {
    name: "kleis",
    description: "an oauth proxy for coding agents",
    href: "https://github.com/rexdotsh/kleis",
    category: "agents / infrastructure",
    language: "TypeScript",
    detail:
      "One base URL for Copilot, Codex, and Claude. Centralized OAuth accounts, automatic token refreshes, and a model registry that coding agents can discover.",
    stack: "Hono · Turso · Drizzle · Bun",
    glyph: "⌘",
    note: "Named for a key that opens many paths.",
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
    category: "security / cli",
    language: "Go",
    detail:
      "An s3enum-compatible CLI with asynchronous DNS, resolver failover, and HTTP verification. Built to look a little further, a little faster.",
    stack: "Go · DNS · HTTP",
    glyph: "⌁",
    note: "From DNS discovery to public-listing checks.",
  },
  {
    name: "claudesync-vscode",
    description: "your code, in Claude Projects",
    href: "https://github.com/rexdotsh/claudesync-vscode",
    category: "developer tools / extension",
    language: "TypeScript",
    detail:
      "Sync a file or an entire workspace to Claude.ai Projects without leaving VS Code. With auto-sync, include/exclude rules, and project instructions.",
    stack: "TypeScript · VS Code API",
    glyph: "⇄",
    note: "Less copying context. More working with it.",
  },
  {
    name: "gh-secrets-cli",
    description: "GitHub Actions secrets, from your terminal",
    href: "https://github.com/rexdotsh/gh-secrets-cli",
    category: "developer tools / cli",
    language: "TypeScript",
    detail:
      "Manage GitHub Actions secrets from env files, JSON, standard input, or local environment variables. A small utility for a repetitive job.",
    stack: "TypeScript · GitHub API",
    glyph: "∴",
    note: "One less trip through repository settings.",
  },
  {
    name: "www",
    description: "you are here, source and all",
    href: "https://github.com/rexdotsh/www",
    category: "the personal web",
    language: "TypeScript",
    detail:
      "A sentence, a rose, and a few doors to open. My little piece of the internet, built with the same tools as everything else here.",
    stack: "React · TanStack Start · Cloudflare",
    glyph: "✳",
    note: "You’re in this one right now.",
  },
];

export const ROOMS = [
  {
    id: "work",
    label: "the work",
    short: "work",
    glyph: "⌘",
    hint: "tools, experiments, and source code",
  },
  {
    id: "writing",
    label: "the notebook",
    short: "notes",
    glyph: "¶",
    hint: "CTFs, reverse engineering, and notes",
  },
  {
    id: "listening",
    label: "the listening room",
    short: "music",
    glyph: "♫",
    hint: "whatever’s on, straight from Spotify",
  },
  {
    id: "garden",
    label: "the shared garden",
    short: "flora",
    glyph: "✳",
    hint: "little things made with friends",
  },
  {
    id: "about",
    label: "the person",
    short: "say hi",
    glyph: "↗",
    hint: "mridul, also known as rex",
  },
  {
    id: "index",
    label: "the index",
    short: "index",
    glyph: "⌕",
    hint: "find your way around",
  },
] as const;

export type Room = (typeof ROOMS)[number]["id"];

export const FLOWERS = [
  {
    name: "sakura",
    glyph: "✿",
    description: "beautiful avatars as a microservice",
    href: "https://github.com/floraorg/sakura",
  },
  {
    name: "faux",
    glyph: "❋",
    description: "placeholders as a microservice",
    href: "https://github.com/floraorg/faux",
  },
  {
    name: "orchid",
    glyph: "✾",
    description: "a meme and profile picture editor",
    href: "https://github.com/floraorg/orchid",
  },
];
