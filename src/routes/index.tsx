import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import DesignSwitcher from "@/components/design-switcher";
import BloomDesign from "@/designs/bloom";
import ClassicDesign from "@/designs/classic";
import DuetDesign from "@/designs/duet";
import { type DesignId, isDesignId } from "@/designs/registry";
import SentenceDesign from "@/designs/sentence";

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
      {design === "bloom" && <BloomDesign hostname={effectiveHostname} />}
      {design === "sentence" && <SentenceDesign hostname={effectiveHostname} />}
      {design === "duet" && <DuetDesign hostname={effectiveHostname} />}
      <DesignSwitcher active={design} persona={persona} />
    </>
  );
}
