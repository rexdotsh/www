import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import DesignSwitcher from "@/components/design-switcher";
import ClassicDesign from "@/designs/classic";
import DuetDesign from "@/designs/duet";
import EncoreDesign from "@/designs/encore";
import { type DesignId, isDesignId } from "@/designs/registry";
import SoloDesign from "@/designs/solo";

const rootRoute = getRouteApi("__root__");

type Persona = "mridul" | "rex";

function isPersona(value: unknown): value is Persona {
  return value === "mridul" || value === "rex";
}

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (
    search: Record<string, unknown>
  ): { d?: DesignId; p?: Persona } => {
    const { d, p } = search;
    return {
      ...(isDesignId(d) && d !== "classic" ? { d } : {}),
      ...(isPersona(p) ? { p } : {}),
    };
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0",
    "Cloudflare-CDN-Cache-Control":
      "public, max-age=3600, stale-while-revalidate=86400",
  }),
});

function Home() {
  const { hostname } = rootRoute.useLoaderData();
  const { d, p } = Route.useSearch();
  const design = d ?? "classic";

  // review-time persona override: preview mridul.sh / rex.wf from anywhere
  const effectiveHostname = p
    ? p === "mridul"
      ? "mridul.sh"
      : "rex.wf"
    : hostname;
  const persona: Persona = effectiveHostname === "mridul.sh" ? "mridul" : "rex";

  return (
    <>
      {design === "classic" && <ClassicDesign hostname={effectiveHostname} />}
      {design === "duet" && <DuetDesign hostname={effectiveHostname} />}
      {design === "solo" && <SoloDesign hostname={effectiveHostname} />}
      {design === "encore" && <EncoreDesign hostname={effectiveHostname} />}
      <DesignSwitcher active={design} persona={persona} />
    </>
  );
}
