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

// paper by default; only the dark choice is pinned
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  // the label only animates for a flip, not for hydration filling it in
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    if (theme) {
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", THEME_COLORS[theme]);
    }
  }, [theme]);

  const toggle = (event: React.MouseEvent) => {
    if (!theme) {
      return;
    }
    const next: Theme = theme === "dark" ? "light" : "dark";
    const apply = () => {
      if (next === "dark") {
        document.documentElement.dataset.theme = "dark";
      } else {
        delete document.documentElement.dataset.theme;
      }
      try {
        if (next === "dark") {
          localStorage.setItem("theme", "dark");
        } else {
          localStorage.removeItem("theme");
        }
      } catch {
        // private mode; the choice just won't persist
      }
      setTheme(next);
      setFlipped(true);
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
      <span className={flipped ? "swap-in" : undefined} key={label}>
        {label}
      </span>{" "}
      <span aria-hidden="true" className="paren">
        )
      </span>
    </button>
  );
}
