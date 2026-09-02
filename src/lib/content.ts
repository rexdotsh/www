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

// where i am: the corner clock and the weather both read this
export const HOME = {
  lat: 12.97,
  lon: 77.59,
  timeZone: "Asia/Kolkata",
};

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
  },
  {
    name: "s3enum-ng",
    description: "high-throughput s3 enumeration",
    href: "https://github.com/rexdotsh/s3enum-ng",
  },
  {
    name: "www",
    description: "you are here, source and all",
    href: "https://github.com/rexdotsh/www",
  },
];
