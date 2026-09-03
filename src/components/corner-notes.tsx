import { useEffect, useState } from "react";
import { isMuted, onMuteChange, setMuted, sfx } from "@/lib/sfx";

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

function nudgeBarSampling() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => probe.remove());
  });
}

export default function CornerNotes() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light"
  );
  const [muted, setMutedState] = useState(isMuted);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => onMuteChange(setMutedState), []);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  const toggle = (event: React.MouseEvent) => {
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
      sfx(next === "dark" ? "lightsOff" : "lightsOn");
    };

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!document.startViewTransition || reduceMotion) {
      apply();
      return;
    }

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

  const toggleSound = () => {
    const next = !isMuted();
    setMuted(next);
    setFlipped(true);
    if (!next) {
      sfx("pop");
    }
  };

  const lightsLabel = LABELS[theme];
  const soundLabel = muted ? "sound off" : "sound on";
  const swap = flipped ? "swap-in" : undefined;

  return (
    <span className="corner-notes">
      <span aria-hidden="true" className="paren">
        (
      </span>{" "}
      <button
        aria-label="toggle color theme"
        className="corner-button"
        onClick={toggle}
        type="button"
      >
        <span className={swap} key={lightsLabel} suppressHydrationWarning>
          {lightsLabel}
        </span>
      </button>
      <span aria-hidden="true" className="text-faint">
        {" · "}
      </span>
      <button
        aria-label="toggle sound effects"
        className="corner-button"
        onClick={toggleSound}
        type="button"
      >
        <span className={swap} key={soundLabel} suppressHydrationWarning>
          {soundLabel}
        </span>
      </button>{" "}
      <span aria-hidden="true" className="paren">
        )
      </span>
    </span>
  );
}
