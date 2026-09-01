import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import DesignSwitcher from "@/components/design-switcher";
import AmbientDesign from "@/designs/ambient";
import BrutalistDesign from "@/designs/brutalist";
import ClassicDesign from "@/designs/classic";
import EditorialDesign from "@/designs/editorial";
import PlayfulDesign from "@/designs/playful";
import { type DesignId, isDesignId } from "@/designs/registry";
import TerminalDesign from "@/designs/terminal";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (search: Record<string, unknown>): { d?: DesignId } => {
    const { d } = search;
    if (isDesignId(d) && d !== "classic") {
      return { d };
    }
    return {};
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const { d } = Route.useSearch();
  const design = d ?? "classic";

  return (
    <>
      {design === "classic" && <ClassicDesign hostname={hostname} />}
      {design === "terminal" && <TerminalDesign hostname={hostname} />}
      {design === "editorial" && <EditorialDesign hostname={hostname} />}
      {design === "brutalist" && <BrutalistDesign hostname={hostname} />}
      {design === "ambient" && <AmbientDesign hostname={hostname} />}
      {design === "playful" && <PlayfulDesign hostname={hostname} />}
      <DesignSwitcher active={design} />
    </>
  );
}
