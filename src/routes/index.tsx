import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import DesignSwitcher from "@/components/design-switcher";
import BloomDesign from "@/designs/bloom";
import BroadsheetDesign from "@/designs/broadsheet";
import BrutalistDesign from "@/designs/brutalist";
import ClassicDesign from "@/designs/classic";
import DeparturesDesign from "@/designs/departures";
import EditorialDesign from "@/designs/editorial";
import MuseumDesign from "@/designs/museum";
import SentenceDesign from "@/designs/sentence";
import SpecDesign from "@/designs/spec";
import { type DesignId, isDesignId } from "@/designs/registry";

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
      {design === "bloom" && <BloomDesign hostname={hostname} />}
      {design === "editorial" && <EditorialDesign hostname={hostname} />}
      {design === "brutalist" && <BrutalistDesign hostname={hostname} />}
      {design === "museum" && <MuseumDesign hostname={hostname} />}
      {design === "spec" && <SpecDesign hostname={hostname} />}
      {design === "departures" && <DeparturesDesign hostname={hostname} />}
      {design === "broadsheet" && <BroadsheetDesign hostname={hostname} />}
      {design === "sentence" && <SentenceDesign hostname={hostname} />}
      <DesignSwitcher active={design} />
    </>
  );
}
