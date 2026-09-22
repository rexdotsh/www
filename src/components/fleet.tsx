import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Health } from "@/lib/fleet";

const W = 100;
const SLIDE_MS = 900;

// Hand-rolled sparkline; `max` fixes the ceiling. The first point sits one
// step off the left edge so that, when a new sample lands, the whole line can
// slide left by one step instead of jumping. Strokes stay crisp under the
// non-uniform viewBox scaling via vector-effect.
export function Sparkline({
  className = "",
  data,
  delay = 0,
  height = 24,
  max,
}: {
  className?: string;
  data: number[];
  delay?: number;
  height?: number;
  max: number;
}) {
  const H = height;
  const n = data.length;
  const step = W / Math.max(1, n - 2);
  const pt = (v: number, i: number) => {
    const x = (i - 1) * step;
    const y = H - 1.5 - (Math.min(v, max) / max) * (H - 3);
    return [x, y] as const;
  };
  const points = data.map(pt);
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const last = points.at(-1) ?? [W, H];
  const style = { animationDelay: `${delay}ms` } as CSSProperties;

  const group = useRef<SVGGElement>(null);
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on every new sample
  useLayoutEffect(() => {
    const el = group.current;
    if (!el) {
      return;
    }
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    el.style.transition = "none";
    el.style.transform = `translateX(${step}px)`;
    el.getBoundingClientRect();
    el.style.transition = `transform ${SLIDE_MS}ms var(--ease-strong)`;
    el.style.transform = "translateX(0)";
  }, [data]);

  return (
    <svg
      aria-hidden="true"
      className={`spark ${className}`}
      preserveAspectRatio="none"
      style={{ height, ...style }}
      viewBox={`0 0 ${W} ${H}`}
    >
      <g ref={group}>
        <path
          className="area"
          d={`${line} L${last[0]} ${H} L${-step} ${H} Z`}
        />
        <path className="line" d={line} vectorEffect="non-scaling-stroke" />
        <circle
          className="tip"
          cx={last[0]}
          cy={last[1]}
          r={1.6}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

const TWEEN_MS = 700;
const ease = (t: number) => 1 - (1 - t) ** 3;

// Eases a number towards its latest value instead of snapping.
export function useTween(target: number) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    if (start === target) {
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / TWEEN_MS);
      current.current = start + (target - start) * ease(k);
      setValue(current.current);
      if (k < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

export function Gauge({ frac, width = 12 }: { frac: number; width?: number }) {
  const on = Math.round(Math.max(0, Math.min(1, frac)) * width);
  return (
    <span
      aria-label={`${Math.round(frac * 100)} percent`}
      className="gauge"
      role="img"
    >
      <span className="on">{"█".repeat(on)}</span>
      <span className="off">{"░".repeat(width - on)}</span>
    </span>
  );
}

// One cell per check, oldest on the left.
export function Strip({
  cells,
  delay = 0,
}: {
  cells: Health[];
  delay?: number;
}) {
  const off = cells.filter((c) => c !== "up").length;
  return (
    <span
      aria-label={
        off === 0
          ? "answered every check"
          : `${off} of ${cells.length} checks off`
      }
      className="strip"
      role="img"
    >
      {cells.map((h, i) => (
        <i
          data-h={h === "up" ? undefined : h}
          key={`${i}-${h}`}
          style={{ animationDelay: `${delay + i * 8}ms` }}
        />
      ))}
    </span>
  );
}

export function Lamp({ health }: { health: Health }) {
  return <i className="lamp" data-health={health} />;
}
