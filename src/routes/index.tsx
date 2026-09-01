import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import DesignSwitcher from "@/components/design-switcher";
import BloomDesign from "@/designs/bloom";
import ClassicDesign from "@/designs/classic";
import DuetDesign from "@/designs/duet";
import { type DesignId, isDesignId } from "@/designs/registry";
import SentenceDesign from "@/designs/sentence";

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
      {design === "sentence" && <SentenceDesign hostname={hostname} />}
      {design === "duet" && <DuetDesign hostname={hostname} />}
      <DesignSwitcher active={design} />
    </>
  );
}
