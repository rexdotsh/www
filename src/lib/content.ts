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
    category: "developer tooling",
    detail:
      "A bridge between coding agents and OAuth. One less thing between you and the work.",
    visual: "proxy",
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
    category: "security tooling",
    detail:
      "S3 enumeration, built for throughput. A tool for exploring what’s out there.",
    visual: "scan",
  },
  {
    name: "www",
    description: "you are here, source and all",
    href: "https://github.com/rexdotsh/www",
    category: "the personal web",
    detail:
      "A home for projects, notes, and small interactions. Built to be explored, source included.",
    visual: "web",
  },
] as const;
