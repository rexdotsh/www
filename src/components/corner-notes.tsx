import { useEffect, useRef, useState } from "react";
import { isMuted, onMuteChange, setMuted, sfx } from "@/lib/sfx";

type Theme = "light" | "dark";

interface Ripple {
  id: number;
  on: boolean;
  x: number;
  y: number;
}

const REVEAL_MS = 550;
const RIPPLE_MS = 900;
const THEME_COLORS: Record<Theme, string> = {
  light: "#faf8f2",
  dark: "#131315",
};
const LABELS: Record<Theme, string> = {
  light: "lights off",
  dark: "lights on",
};

const CORD = 30;
const PULL = 12;
const SLACK = 24;

function PullCord({ onPull }: { onPull: (x: number, y: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pullRef = useRef(onPull);
  pullRef.current = onPull;

  useEffect(() => {
    const svg = svgRef.current;
    const swing = svg?.querySelector("g");
    const chain = svg?.querySelector("line");
    const knob = svg?.querySelector<SVGGElement>(".cord-knob");
    if (!(svg && swing && chain && knob)) {
      return;
    }
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let angle = calm ? 0 : 0.3;
    let spin = 0;
    let stretch = calm ? 0 : -18;
    let give = 0;
    let raf = 0;
    let last = 0;
    let prev: { x: number; y: number } | null = null;
    let held: {
      id: number;
      pulled: boolean;
      reach: number;
      x: number;
      y: number;
    } | null = null;

    const pivot = () => {
      const box = svg.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - (last || now - 16)) / 1000);
      last = now;
      if (calm && !held) {
        angle = 0;
        spin = 0;
        stretch = 0;
        give = 0;
      } else if (!held) {
        spin += (-38 * Math.sin(angle) - 1.3 * spin) * dt;
        angle += spin * dt;
        give += (-320 * stretch - 13 * give) * dt;
        stretch += give * dt;
      }
      swing.setAttribute("transform", `rotate(${(angle * 180) / Math.PI})`);
      chain.setAttribute("y2", String(CORD + stretch));
      knob.setAttribute("transform", `translate(0 ${CORD + stretch})`);
      const settled =
        !held &&
        Math.abs(angle) + Math.abs(spin) < 0.002 &&
        Math.abs(stretch) + Math.abs(give) < 0.05;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onBrush = (e: PointerEvent) => {
      const here = { x: e.clientX, y: e.clientY };
      if (calm || held || e.pointerType !== "mouse") {
        prev = here;
        return;
      }
      const p = pivot();
      const reach = (CORD + stretch + 10) * Math.cos(angle);
      const side = (q: { x: number; y: number }) =>
        q.x - (p.x - (q.y - p.y) * Math.tan(angle));
      if (
        prev &&
        here.y > p.y &&
        here.y < p.y + reach &&
        Math.sign(side(prev)) !== Math.sign(side(here))
      ) {
        spin -= Math.max(-40, Math.min(40, here.x - prev.x)) * 0.07;
        wake();
      }
      prev = here;
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      knob.setPointerCapture(e.pointerId);
      const p = pivot();
      held = {
        id: e.pointerId,
        pulled: false,
        reach: Math.hypot(e.clientX - p.x, e.clientY - p.y) - stretch,
        x: e.clientX,
        y: e.clientY,
      };
      spin = 0;
      give = 0;
      wake();
    };
    const onDrag = (e: PointerEvent) => {
      if (held?.id !== e.pointerId) {
        return;
      }
      const p = pivot();
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      angle = Math.max(-0.9, Math.min(0.9, Math.atan2(-dx, dy)));
      stretch = Math.max(0, Math.min(SLACK, Math.hypot(dx, dy) - held.reach));
      if (stretch >= PULL && !held.pulled) {
        held.pulled = true;
        pullRef.current(e.clientX, e.clientY);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (held?.id !== e.pointerId) {
        return;
      }
      const tapped =
        !held.pulled && Math.hypot(e.clientX - held.x, e.clientY - held.y) < 4;
      held = null;
      if (tapped) {
        give = calm ? 0 : 300;
        pullRef.current(e.clientX, e.clientY);
      }
      wake();
    };

    wake();
    window.addEventListener("pointermove", onBrush, { passive: true });
    knob.addEventListener("pointerdown", onDown);
    knob.addEventListener("pointermove", onDrag);
    knob.addEventListener("pointerup", onUp);
    knob.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onBrush);
      knob.removeEventListener("pointerdown", onDown);
      knob.removeEventListener("pointermove", onDrag);
      knob.removeEventListener("pointerup", onUp);
      knob.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <svg aria-hidden="true" className="cord" ref={svgRef} viewBox="-30 0 60 80">
      <g>
        <line className="cord-chain" x1="0" x2="0" y1="0" y2={CORD} />
        <g className="cord-knob" transform={`translate(0 ${CORD})`}>
          <circle className="cord-grip" cy="6" r="12" />
          <path d="M0 0C2.6 2.2 4 5.2 4 7.6 4 9.9 2.2 11.4 0 11.4S-4 9.9-4 7.6C-4 5.2-2.6 2.2 0 0Z" />
        </g>
      </g>
    </svg>
  );
}

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
  const [mounted, setMounted] = useState(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const rippleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setMounted(true);
    return onMuteChange(setMutedState);
  }, []);
  useEffect(() => () => clearTimeout(rippleTimer.current), []);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  const toggle = (x: number, y: number) => {
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
        // Ignore storage errors.
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

  const toggleSound = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !isMuted();
    setMuted(next);
    setFlipped(true);
    if (!next) {
      sfx("pop");
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({
      id: Date.now(),
      on: !next,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(null), RIPPLE_MS);
  };

  const lightsLabel = LABELS[mounted ? theme : "light"];
  const soundLabel = mounted && muted ? "sound off" : "sound on";
  const swap = flipped ? "swap-in" : undefined;

  return (
    <>
      {ripple ? (
        <span
          aria-hidden="true"
          className="sound-ripple"
          data-off={ripple.on ? undefined : ""}
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
        >
          <span />
          <span />
          <span />
        </span>
      ) : null}
      <span className="corner-notes">
        <PullCord onPull={toggle} />
        <span aria-hidden="true" className="paren">
          (
        </span>{" "}
        <button
          aria-label="toggle color theme"
          className="corner-button"
          onClick={(event) => toggle(event.clientX, event.clientY)}
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
        </button>{" "}
        <span aria-hidden="true" className="paren">
          )
        </span>
      </span>
    </>
  );
}
