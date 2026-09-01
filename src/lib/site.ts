import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const DEFAULT_ORIGIN = "https://rex.wf";

export const getSiteInfo = createServerFn({ method: "GET" }).handler(() => {
  const request = getRequest();
  const publicUrl = new URL(request.url || DEFAULT_ORIGIN);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (forwardedHost) {
    publicUrl.port = "";
    publicUrl.host = forwardedHost;
  }
  if (forwardedProtocol === "http" || forwardedProtocol === "https") {
    publicUrl.protocol = `${forwardedProtocol}:`;
  }

  return {
    baseUrl: publicUrl.origin,
    hostname: publicUrl.hostname.toLowerCase(),
  };
});
