import type { CSSProperties } from "react";
import type { Health } from "@/lib/fleet";

const W = 100;

// Hand-rolled sparkline; `max` fixes the ceiling. Strokes stay crisp under the
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
  const pt = (v: number, i: number) => {
    const x = n === 1 ? W : (i / (n - 1)) * W;
    const y = H - 1.5 - (Math.min(v, max) / max) * (H - 3);
    return [x, y] as const;
  };
  const points = data.map(pt);
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const last = points.at(-1) ?? [W, H];
  const style = { animationDelay: `${delay}ms` } as CSSProperties;

  return (
    <svg
      aria-hidden="true"
      className={`spark ${className}`}
      preserveAspectRatio="none"
      style={{ height, ...style }}
      viewBox={`0 0 ${W} ${H}`}
    >
      <path className="area" d={`${line} L${W} ${H} L0 ${H} Z`} style={style} />
      <path
        className="line"
        d={line}
        pathLength={1}
        style={style}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        className="tip"
        cx={last[0]}
        cy={last[1]}
        r={1.6}
        style={{ animationDelay: `${delay + 900}ms` }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
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
          style={{ animationDelay: `${delay + i * 6}ms` }}
        />
      ))}
    </span>
  );
}

export function Lamp({ health }: { health: Health }) {
  return <i className="lamp" data-health={health} />;
}

export function Cursor() {
  return (
    <span aria-hidden="true" className="cursor">
      ▌
    </span>
  );
}
