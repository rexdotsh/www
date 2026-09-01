import { createFileRoute } from "@tanstack/react-router";
import { permanentRedirect } from "@/lib/permanent-redirect";

export const Route = createFileRoute("/blog")({
  server: {
    handlers: {
      GET: () => permanentRedirect("https://blog.rex.wf"),
    },
  },
});
