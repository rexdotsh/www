const OG_IMAGE_VERSION = import.meta.env.VITE_OG_IMAGE_VERSION ?? "dev";

export const ogImageUrl = (path: string, baseUrl: string) =>
  new URL(`${path}?v=${OG_IMAGE_VERSION}`, baseUrl).href;

export const isTouch = () => matchMedia("(hover: none)").matches;

export const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// Safari has no requestIdleCallback.
export const whenIdle = (fn: () => void) => {
  if ("requestIdleCallback" in window) {
    const idle = requestIdleCallback(fn);
    return () => cancelIdleCallback(idle);
  }
  const timeout = setTimeout(fn, 1200);
  return () => clearTimeout(timeout);
};

export const getJson = <T>(url: string) =>
  fetch(url)
    .then((response) => (response.ok ? (response.json() as Promise<T>) : null))
    .catch(() => null);
