import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const DEFAULT_ORIGIN = "https://rex.wf";
const PUBLIC_HOSTS = new Map([
  ["mridul.sh", "mridul.sh"],
  ["rex.wf", "rex.wf"],
  ["www.mridul.sh", "mridul.sh"],
  ["www.rex.wf", "rex.wf"],
]);

function parseHostname(host: string | undefined) {
  if (!host) {
    return;
  }

  try {
    return new URL(`https://${host}`).hostname.toLowerCase();
  } catch {
    // Ignore malformed proxy headers.
  }
}

export function resolveSiteInfo(request: Request) {
  const publicUrl = new URL(request.url || DEFAULT_ORIGIN);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const canonicalHost =
    PUBLIC_HOSTS.get(parseHostname(forwardedHost) ?? "") ??
    PUBLIC_HOSTS.get(publicUrl.hostname.toLowerCase());

  if (canonicalHost) {
    publicUrl.port = "";
    publicUrl.host = canonicalHost;
    publicUrl.protocol = "https:";
  } else if (forwardedProtocol === "http" || forwardedProtocol === "https") {
    publicUrl.protocol = `${forwardedProtocol}:`;
  }

  return {
    baseUrl: publicUrl.origin,
    hostname: publicUrl.hostname.toLowerCase(),
    isPublicHost: Boolean(canonicalHost),
  };
}

export const getSiteInfo = createServerFn({ method: "GET" }).handler(() =>
  resolveSiteInfo(getRequest())
);
