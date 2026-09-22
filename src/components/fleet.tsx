import type { CSSProperties } from "react";
import { type Health, HEALTH_LABEL } from "@/lib/fleet";

const W = 100;

// Hand-rolled sparkline. `max` fixes the ceiling (e.g. 100 for percentages or
// a disk's capacity); otherwise it fits the data. Strokes stay crisp under the
// non-uniform viewBox scaling via vector-effect.
export function Sparkline({
  area = true,
  cap,
  className = "",
  data,
  delay = 0,
  height = 28,
  max,
  tip = true,
}: {
  area?: boolean;
  cap?: number;
  className?: string;
  data: number[];
  delay?: number;
  height?: number;
  max?: number;
  tip?: boolean;
}) {
  const H = height;
  const top = max ?? Math.max(1, ...data) * 1.08;
  const n = data.length;
  const pt = (v: number, i: number) => {
    const x = n === 1 ? W : (i / (n - 1)) * W;
    const y = H - 1.5 - (Math.min(v, top) / top) * (H - 3);
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
      {cap === undefined ? null : (
        <line
          className="cap"
          vectorEffect="non-scaling-stroke"
          x1={0}
          x2={W}
          y1={pt(cap, 0)[1]}
          y2={pt(cap, 0)[1]}
        />
      )}
      {area ? (
        <path
          className="area"
          d={`${line} L${W} ${H} L0 ${H} Z`}
          style={style}
        />
      ) : null}
      <path
        className="line"
        d={line}
        pathLength={1}
        style={style}
        vectorEffect="non-scaling-stroke"
      />
      {tip ? (
        <circle
          className="tip"
          cx={last[0]}
          cy={last[1]}
          r={1.6}
          style={{ animationDelay: `${delay + 1200}ms` }}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}

export function Pulse({
  className = "",
  health,
}: {
  className?: string;
  health: Health;
}) {
  return (
    <i
      aria-label={HEALTH_LABEL[health]}
      className={`pulse ${className}`}
      data-health={health}
      role="img"
    />
  );
}

// 90 checks, oldest on the left.
export function Strip({
  cells,
  delay = 0,
}: {
  cells: Health[];
  delay?: number;
}) {
  const down = cells.filter((c) => c !== "up").length;
  return (
    <span
      aria-label={
        down === 0
          ? "answered every check"
          : `${down} of ${cells.length} checks off`
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
