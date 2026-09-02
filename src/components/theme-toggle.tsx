import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const REVEAL_MS = 550;
const THEME_COLORS: Record<Theme, string> = {
  light: "#faf8f2",
  dark: "#131315",
};
const LABELS: Record<Theme, string> = {
  light: "lights off",
  dark: "lights on",
};

// ios safari re-samples its bar colours only when a fixed element comes or
// goes, never on a style change. see tint-strips.tsx
function nudgeBarSampling() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => probe.remove());
  });
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const pinned = document.documentElement.dataset.theme as
        | Theme
        | undefined;
      setTheme(pinned ?? (system.matches ? "dark" : "light"));
    };
    const onSystemChange = () => {
      sync();
      nudgeBarSampling();
    };
    sync();
    system.addEventListener("change", onSystemChange);
    return () => system.removeEventListener("change", onSystemChange);
  }, []);

  // chrome on android still reads theme-color
  useEffect(() => {
    if (!(theme && document.documentElement.dataset.theme)) {
      return;
    }
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", THEME_COLORS[theme]);
    }
  }, [theme]);

  const toggle = (event: React.MouseEvent) => {
    if (!theme) {
      return;
    }
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // private mode; the choice just won't persist
      }
      setTheme(next);
      nudgeBarSampling();
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!document.startViewTransition || reduceMotion) {
      apply();
      return;
    }

    // circular reveal of the new palette, wiping out from the cursor
    const { clientX: x, clientY: y } = event;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    document.documentElement.dataset.vt = "theme";
    const transition = document.startViewTransition(apply);
    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: REVEAL_MS,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
    transition.finished.finally(() => {
      delete document.documentElement.dataset.vt;
    });
  };

  const label = theme ? LABELS[theme] : "lights";

  return (
    <button
      aria-label="toggle color theme"
      className="theme-toggle"
      onClick={toggle}
      type="button"
    >
      <span aria-hidden="true" className="paren">
        (
      </span>{" "}
      <span className="swap-in" key={label}>
        {label}
      </span>{" "}
      <span aria-hidden="true" className="paren">
        )
      </span>
    </button>
  );
}
