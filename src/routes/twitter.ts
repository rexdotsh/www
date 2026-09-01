import { createFileRoute } from "@tanstack/react-router";
import { permanentRedirect } from "@/lib/permanent-redirect";

export const Route = createFileRoute("/twitter")({
  server: {
    handlers: {
      GET: () => permanentRedirect("https://x.com/rexmkv"),
    },
  },
});
