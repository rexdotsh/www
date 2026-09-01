export interface SiteIdentity {
  domain: string;
  handle: string;
  isMridul: boolean;
  name: string;
  otherDomain: string;
  otherName: string;
}

export function getIdentity(hostname: string): SiteIdentity {
  // const isMridul = hostname === "mridul.sh";
  const isMridul = true;
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
  blog: "https://blog.rex.wf",
  flora: "https://floraorg.github.io",
  github: "https://github.com/rexdotsh",
  twitter: "https://x.com/rexmkv",
};

export const PROJECTS = [
  {
    name: "kleis",
    description: "opencode-first oauth proxy for coding agents",
    href: "https://github.com/rexdotsh/kleis",
  },
  {
    name: "flora",
    description: "random utilities for the web, with friends",
    href: "https://floraorg.github.io",
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 bucket enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
  },
];

// placeholders — port real posts from blog.rex.wf
export const POSTS = [
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
