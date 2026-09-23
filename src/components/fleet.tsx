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

// The first point sits one step off the left edge so that, when a new sample
// lands, the whole line can slide left by one step instead of jumping.
export function Sparkline({
  className,
  data,
  delay,
  height: H = 24,
  max,
  scrub,
}: {
  className: string;
  data: number[];
  delay: number;
  height?: number;
  max: number;
  scrub?: (value: number, ago: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = data.length;
  const step = W / Math.max(1, n - 2);
  const points = data.map(
    (v, i) =>
      [(i - 1) * step, H - 1.5 - (Math.min(v, max) / max) * (H - 3)] as const
  );
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const last = points.at(-1) ?? [W, H];

  const group = useRef<SVGGElement>(null);
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on every new sample
  useLayoutEffect(() => {
    const el = group.current;
    if (!el) return;
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

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 2)) + 1;
    setHover(Math.max(1, Math.min(n - 1, i)));
  };
  const at = hover === null ? null : points[hover];

  const svg = (
    <svg
      aria-hidden="true"
      className={`spark ${className}`}
      preserveAspectRatio="none"
      style={{ height: H, animationDelay: `${delay}ms` }}
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
        {at ? (
          <>
            <line
              className="scrub-line"
              vectorEffect="non-scaling-stroke"
              x1={at[0]}
              x2={at[0]}
              y1={0}
              y2={H}
            />
            <circle
              className="scrub-dot"
              cx={at[0]}
              cy={at[1]}
              r={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </g>
    </svg>
  );

  if (!scrub) return svg;
  return (
    <span
      className="spark-scrub"
      onPointerLeave={() => setHover(null)}
      onPointerMove={onMove}
    >
      {svg}
      {at && hover !== null ? (
        <span className="spark-label" style={{ left: `${(at[0] / W) * 100}%` }}>
          {scrub(data[hover], n - 1 - hover)}
        </span>
      ) : null}
    </span>
  );
}

const TWEEN_MS = 700;
const ease = (t: number) => 1 - (1 - t) ** 3;

export function useTween(target: number) {
  const [value, setValue] = useState(target);
  const [moving, setMoving] = useState(false);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    if (start === target) return;
    const t0 = performance.now();
    let frame = 0;
    setMoving(true);
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / TWEEN_MS);
      current.current = start + (target - start) * ease(k);
      setValue(current.current);
      if (k < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setMoving(false);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return { value, moving };
}

export function Gauge({ frac, width = 17 }: { frac: number; width?: number }) {
  const on = Math.round(Math.max(0, Math.min(1, frac)) * width);
  return (
    <span
      aria-label={`${Math.round(frac * 100)} percent`}
      className="gauge"
      role="img"
    >
      <span className="on">{"█".repeat(on)}</span>
      <span className="off">
        {Array.from({ length: width - on }, (_, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties}>
            ░
          </span>
        ))}
      </span>
    </span>
  );
}

const word = (h: Health) => (h === "none" ? "no data" : h);

const hhmm = (ts: number) => new Date(ts).toISOString().slice(11, 16);

export function Strip({
  cells,
  delay,
  end,
}: {
  cells: Health[];
  delay: number;
  end: number;
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
          title={
            end
              ? `${hhmm(end - (cells.length - 1 - i) * 60_000)} utc · ${word(h)}`
              : word(h)
          }
        />
      ))}
    </span>
  );
}

export function Lamp({ health }: { health: Health }) {
  return <i className="lamp" data-health={health} />;
}
