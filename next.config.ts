import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "https://blog.rex.wf",
        permanent: true,
      },
      {
        source: "/twitter",
        destination: "https://x.com/rexmkv",
        permanent: true,
      },
      {
        source: "/x",
        destination: "https://x.com/rexmkv",
        permanent: true,
      },
      {
        source: "/github",
        destination: "https://github.com/rexdotsh",
        permanent: true,
      },
      {
        source: "/flora",
        destination: "https://flora.tf",
        permanent: true,
      },
      {
        source: "/resume",
        destination: "https://mridul.sh/resume",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
