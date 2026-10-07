export function getIdentity(hostname: string) {
  const isMridul = hostname === "mridul.sh";
  return {
    name: isMridul ? "mridul" : "rex",
    otherName: isMridul ? "rex" : "mridul",
    otherDomain: isMridul ? "rex.wf" : "mridul.sh",
    handle: "rexmkv",
    isMridul,
  };
}

export const EMAIL = "hey@mridul.sh";

export const LINKS = {
  email: `mailto:${EMAIL}`,
  archive: "https://github.com/rexdotsh/ctf-writeups",
  blog: "/blog",
  flora: "https://floraorg.github.io",
  github: "https://github.com/rexdotsh",
  resume: "https://mridul.sh/resume",
  twitter: "https://x.com/rexmkv",
};

export const PROJECTS = [
  {
    name: "kleis",
    description: "oauth proxy for coding agents",
    href: "https://github.com/rexdotsh/kleis",
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
    spare: true,
  },
  {
    name: "www",
    description: "you are here, source and all",
    href: "https://github.com/rexdotsh/www",
  },
  {
    name: "flora",
    description: "random things for the web",
    href: LINKS.flora,
  },
];
