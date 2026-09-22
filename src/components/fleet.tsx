import type { Health } from "@/lib/fleet";

// Everything here is text. What the page shows is what `curl` will print,
// minus the colour.

const BLOCKS = "▁▂▃▄▅▆▇█";

export const bars = (data: number[], max: number, width = data.length) =>
  data
    .slice(-width)
    .map((v) => {
      const i = Math.round((Math.min(v, max) / max) * (BLOCKS.length - 1));
      return BLOCKS[i] ?? "▁";
    })
    .join("");

export function Bars({
  className = "",
  data,
  max,
  width,
}: {
  className?: string;
  data: number[];
  max: number;
  width?: number;
}) {
  return (
    <span aria-hidden="true" className={`bars ${className}`}>
      {Array.from(bars(data, max, width), (glyph, i) => (
        <span key={`${i}-${glyph}`}>{glyph}</span>
      ))}
    </span>
  );
}

export function Gauge({ frac, width = 20 }: { frac: number; width?: number }) {
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

const SEISMO: Record<Health, string> = { up: "▁", slow: "▄", down: "█" };

// Uptime as a seismograph: flat is good.
export function Seismo({
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
      className="seismo"
      role="img"
    >
      {cells.map((h, i) => (
        <span
          data-h={h === "up" ? undefined : h}
          key={`${i}-${h}`}
          style={{ animationDelay: `${delay + i * 8}ms` }}
        >
          {SEISMO[h]}
        </span>
      ))}
    </span>
  );
}

export function Cursor() {
  return (
    <span aria-hidden="true" className="cursor">
      ▌
    </span>
  );
}

export const STATE: Record<Health, string> = {
  up: "ok",
  slow: "slow",
  down: "down",
};
