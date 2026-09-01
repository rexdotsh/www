import { createFileRoute } from "@tanstack/react-router";
import { permanentRedirect } from "@/lib/permanent-redirect";

export const Route = createFileRoute("/flora")({
  server: {
    handlers: {
      GET: () => permanentRedirect("https://floraorg.github.io"),
    },
  },
});
