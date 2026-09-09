import type { ReactNode } from "react";
import type { Ranked } from "@/lib/mock-stats";

const HEAT_COLORS = [
  "var(--heat-0)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
];

// ── sparkline ────────────────────────────────────────────────────────────

const SPARK_W = 560;
const SPARK_H = 96;
const SPARK_PAD = 6;

const toPoints = (values: number[]) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = (SPARK_W - SPARK_PAD * 2) / (values.length - 1);
  return values.map((v, i) => {
    const x = SPARK_PAD + i * step;
    const y = SPARK_PAD + (1 - (v - min) / span) * (SPARK_H - SPARK_PAD * 2);
    return [x, y] as const;
  });
};

// smooth-ish curve via catmull-rom → bezier
const toPath = (points: readonly (readonly [number, number])[]) => {
  if (points.length < 2) return "";
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

export function Sparkline({
  values,
  annotate,
}: {
  values: number[];
  annotate?: { index: number; label: string };
}) {
  const points = toPoints(values);
  const line = toPath(points);
  const last = points.at(-1) ?? [0, 0];
  const area = `${line} L${last[0].toFixed(1)},${SPARK_H} L${SPARK_PAD},${SPARK_H} Z`;
  const mark = annotate ? points[annotate.index] : null;

  return (
    <svg
      aria-label="visitors per day, past thirty days"
      className="spark block h-auto w-full overflow-visible"
      role="img"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--rose)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--rose)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="spark-area" d={area} fill="url(#spark-fill)" />
      <path
        className="spark-line"
        d={line}
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
      {mark ? (
        <g className="spark-note">
          <line
            stroke="var(--rose)"
            strokeDasharray="2 3"
            strokeWidth="1"
            x1={mark[0]}
            x2={mark[0]}
            y1={mark[1] + 6}
            y2={SPARK_H}
          />
          <text
            fill="var(--rose)"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontStyle="italic"
            textAnchor={mark[0] > SPARK_W * 0.7 ? "end" : "start"}
            x={mark[0] + (mark[0] > SPARK_W * 0.7 ? -6 : 6)}
            y={mark[1] - 4}
          >
            {annotate?.label}
          </text>
        </g>
      ) : null}
      <circle
        className="spark-dot"
        cx={last[0]}
        cy={last[1]}
        fill="var(--rose)"
        r="3"
      />
      <circle
        className="spark-ring"
        cx={last[0]}
        cy={last[1]}
        fill="none"
        r="3"
        stroke="var(--rose)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ── heat grid ────────────────────────────────────────────────────────────

export function HeatGrid({ weeks }: { weeks: number[][] }) {
  return (
    <div className="heat-grid" style={{ "--cols": weeks.length } as never}>
      {weeks.map((week, w) => (
        <div className="heat-col" key={`w${w}`}>
          {week.map((level, d) => (
            <span
              className="heat-cell"
              key={`d${d}`}
              style={{
                backgroundColor: HEAT_COLORS[level],
                animationDelay: `${w * 12 + d * 4}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── ranked list with bars ────────────────────────────────────────────────

const percent = (n: number) => `${Math.round(n * 100)}%`;

export function RankList({
  items,
  format = percent,
  delay = 0,
}: {
  items: Ranked[];
  format?: (value: number) => string;
  delay?: number;
}) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ol className="rank-list">
      {items.map((item, i) => (
        <li
          className="rank-row"
          key={item.label}
          style={{ animationDelay: `${delay + i * 55}ms` }}
        >
          <span className="rank-label">
            {item.label}
            {item.sub ? <span className="rank-sub"> — {item.sub}</span> : null}
          </span>
          <span className="rank-value">{format(item.value)}</span>
          <span className="rank-track">
            <span
              className="rank-bar"
              data-top={i === 0 ? "" : undefined}
              style={
                {
                  "--w": `${(item.value / max) * 100}%`,
                  animationDelay: `${delay + 120 + i * 55}ms`,
                } as never
              }
            />
          </span>
        </li>
      ))}
    </ol>
  );
}

// ── column bars (hours, deciles) ─────────────────────────────────────────

export function Columns({
  values,
  highlight,
  ticks,
  label,
}: {
  values: number[];
  highlight?: number;
  ticks?: ReactNode;
  label: string;
}) {
  const max = Math.max(...values);
  return (
    <div>
      <div
        aria-label={label}
        className="cols"
        role="img"
        style={{ "--n": values.length } as never}
      >
        {values.map((v, i) => (
          <span
            className="col"
            data-hi={i === highlight ? "" : undefined}
            key={`c${i}`}
            style={
              {
                "--h": `${(v / max) * 100}%`,
                animationDelay: `${i * 22}ms`,
              } as never
            }
          />
        ))}
      </div>
      {ticks ? <div className="cols-ticks">{ticks}</div> : null}
    </div>
  );
}

// ── split (two-value ratio) ──────────────────────────────────────────────

export function Split({
  a,
  b,
  ratio,
}: {
  a: string;
  b: string;
  ratio: number;
}) {
  return (
    <div className="split">
      <span className="split-track">
        <span
          className="split-a"
          style={{ "--w": `${ratio * 100}%` } as never}
        />
      </span>
      <span className="split-labels">
        <span className="text-ink">
          {a} <span className="text-faint">{percent(ratio)}</span>
        </span>
        <span className="text-muted">
          <span className="text-faint">{percent(1 - ratio)}</span> {b}
        </span>
      </span>
    </div>
  );
}
