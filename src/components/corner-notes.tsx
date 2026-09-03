import { useEffect, useState } from "react";
import { HOME } from "@/lib/content";
import { isMuted, onMuteChange, setMuted, sfx } from "@/lib/sfx";

type Theme = "light" | "dark";

const CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: HOME.timeZone,
});

// the time where i am, kept to the minute; client only so hydration matches
function useHomeClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const read = () => {
      const now = new Date();
      setTime(CLOCK.format(now));
      timer = setTimeout(read, 60_000 - (now.getTime() % 60_000) + 50);
    };
    read();
    return () => clearTimeout(timer);
  }, []);
  return time;
}

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

// ( lights off · sound off ): paper and sound by default, both choices pinned
export default function CornerNotes() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [muted, setMutedState] = useState(false);
  // labels only animate for a flip, not for hydration filling them in
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
    setMutedState(isMuted());
    return onMuteChange(setMutedState);
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
      sfx(next === "dark" ? "lightsOff" : "lightsOn");
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

  const toggleSound = () => {
    const next = !isMuted();
    setMuted(next);
    setFlipped(true);
    if (!next) {
      sfx("pop");
    }
  };

  const lightsLabel = theme ? LABELS[theme] : "lights";
  const soundLabel = muted ? "sound on" : "sound off";
  const swap = flipped ? "swap-in" : undefined;
  const time = useHomeClock();

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
        <span className={swap} key={lightsLabel}>
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
        <span className={swap} key={soundLabel}>
          {soundLabel}
        </span>
      </button>
      {time ? (
        <span className="corner-time">
          <span aria-hidden="true" className="text-faint">
            {" · "}
          </span>
          {time} where i am
        </span>
      ) : null}{" "}
      <span aria-hidden="true" className="paren">
        )
      </span>
    </span>
  );
}
