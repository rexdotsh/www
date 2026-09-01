import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DESIGNS, type DesignId } from "@/designs/registry";

/**
 * Review-time dock for flipping between the five redesigns.
 * Keyboard: 0-5. Shareable via ?d=<id>. Delete once a winner is picked.
 */
export default function DesignSwitcher({ active }: { active: DesignId }) {
  const navigate = useNavigate();

  const setDesign = (id: DesignId) => {
    navigate({
      to: "/",
      search: id === "classic" ? {} : { d: id },
      replace: true,
    });
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
          search: design.id === "classic" ? {} : { d: design.id },
          replace: true,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const activeName = DESIGNS.find((d) => d.id === active)?.name ?? "classic";

  return (
    <div className="-translate-x-1/2 fixed bottom-3 left-1/2 z-[100] font-mono">
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
        <span className="pointer-events-none select-none pr-2 pl-1.5 text-[10px] text-white/40 tracking-wider">
          {activeName}
        </span>
      </div>
    </div>
  );
}
