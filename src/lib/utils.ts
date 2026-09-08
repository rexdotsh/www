const OG_IMAGE_VERSION = import.meta.env.VITE_OG_IMAGE_VERSION ?? "dev";

export const ogImageUrl = (path: string, baseUrl: string) =>
  new URL(`${path}?v=${OG_IMAGE_VERSION}`, baseUrl).href;
