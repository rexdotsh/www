import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DESIGNS, type DesignId } from "@/designs/registry";

type Persona = "mridul" | "rex";

function buildSearch(design: DesignId, who: Persona) {
  return {
    ...(design === "classic" ? {} : { d: design }),
    ...(who === "rex" ? {} : { p: who }),
  };
}

/**
 * Review-time dock for flipping between the redesign finalists and the
 * two personas (rex.wf / mridul.sh). Keyboard: 0-3 for designs.
 * Shareable via ?d=<id>&p=<persona>. Delete once a winner is picked.
 */
export default function DesignSwitcher({
  active,
  persona,
}: {
  active: DesignId;
  persona: Persona;
}) {
  const navigate = useNavigate();

  const setDesign = (id: DesignId) => {
    navigate({ to: "/", search: buildSearch(id, persona), replace: true });
  };

  const setPersona = (who: Persona) => {
    navigate({ to: "/", search: buildSearch(active, who), replace: true });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) {
        return;
      }
      const design = DESIGNS.find((d) => d.key === event.key);
      if (design) {
        navigate({
          to: "/",
          search: buildSearch(design.id, persona),
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, persona]);

  const activeName = DESIGNS.find((d) => d.id === active)?.name ?? "classic";

  return (
    <div className="fixed right-3 bottom-3 z-[100] font-mono opacity-60 transition-opacity duration-200 focus-within:opacity-100 hover:opacity-100">
      <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-black/75 px-1.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {DESIGNS.map((design) => (
          <button
            aria-label={`Switch to ${design.name} design`}
            aria-pressed={design.id === active}
            className={`h-6 w-6 cursor-pointer rounded-full text-[11px] leading-none transition-colors duration-150 ${
              design.id === active
                ? "bg-white text-black"
                : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
            key={design.id}
            onClick={() => setDesign(design.id)}
            type="button"
          >
            {design.key}
          </button>
        ))}
        <span className="pointer-events-none select-none pr-1 pl-1.5 text-[10px] text-white/40 tracking-wider">
          {activeName}
        </span>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/15" />
        {(["rex", "mridul"] as const).map((who) => (
          <button
            aria-label={`Preview as ${who === "rex" ? "rex.wf" : "mridul.sh"}`}
            aria-pressed={persona === who}
            className={`h-6 cursor-pointer rounded-full px-2 text-[10px] leading-none transition-colors duration-150 ${
              persona === who
                ? "bg-white/90 text-black"
                : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
            key={who}
            onClick={() => setPersona(who)}
            type="button"
          >
            {who}
          </button>
        ))}
      </div>
    </div>
  );
}
