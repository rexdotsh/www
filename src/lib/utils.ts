const OG_IMAGE_VERSION = import.meta.env.VITE_OG_IMAGE_VERSION ?? "dev";

export const ogImageUrl = (path: string, baseUrl: string) =>
  new URL(`${path}?v=${OG_IMAGE_VERSION}`, baseUrl).href;

export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}
