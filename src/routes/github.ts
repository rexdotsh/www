import { createFileRoute } from "@tanstack/react-router";
import { permanentRedirect } from "@/lib/permanent-redirect";

export const Route = createFileRoute("/github")({
  server: {
    handlers: {
      GET: () => permanentRedirect("https://github.com/rexdotsh"),
    },
  },
});
