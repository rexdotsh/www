"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const GRID = [
  [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
];

const ROWS = GRID.length;
const COLS = GRID[0].length;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 4000;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16_807) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

const SCATTER_OFFSETS = (() => {
  const rand = seededRandom(404);
  return Array.from({ length: ROWS * COLS }, () => ({
    x: (rand() - 0.5) * 600,
    y: (rand() - 0.5) * 400,
  }));
})();

function forEachCell(
  fn: (el: HTMLSpanElement, r: number, c: number) => void,
  cells: (HTMLSpanElement | null)[]
) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!GRID[r][c]) continue;
      const el = cells[r * COLS + c];
      if (el) fn(el, r, c);
    }
  }
}

const GLYPHS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

function ScrambleLink({ text, href }: { text: string; href: string }) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<ReturnType<typeof setInterval>>(null);

  const stop = () => {
    if (ref.current) clearInterval(ref.current);
    setDisplay(text);
  };

  const start = () => {
    let t = 0;
    stop();
    ref.current = setInterval(() => {
      if (t >= text.length) return stop();
      setDisplay(
        Array.from(text, (ch, i) =>
          ch === " " || i < t
            ? ch
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        ).join("")
      );
      t += 1 / 3;
    }, 30);
  };

  return (
    <Link
      className="mt-1.5 text-lg text-secondary transition-colors duration-200 hover:text-primary-hover dark:hover:text-white"
      href={href}
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {display}
    </Link>
  );
}

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef(0);
  const assembled = useRef(false);

  useEffect(() => {
    const cells = cellRefs.current;

    const assembleTimeout = setTimeout(() => {
      forEachCell((el) => {
        el.style.transition =
          "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out";
        el.style.transform = "translate(0px, 0px)";
        el.style.opacity = "1";
      }, cells);
    }, 100);

    const interactiveTimeout = setTimeout(() => {
      assembled.current = true;
      forEachCell((el) => {
        el.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
      }, cells);
    }, 1000);

    return () => {
      clearTimeout(assembleTimeout);
      clearTimeout(interactiveTimeout);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (!assembled.current) {
        rafId.current = requestAnimationFrame(animate);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cellW = rect.width / COLS;
      const cellH = rect.height / ROWS;
      const mp = mousePos.current;

      forEachCell((el, r, c) => {
        if (!mp) {
          el.style.transform = "translate(0px, 0px)";
          el.style.opacity = "1";
          return;
        }

        const dx = rect.left + c * cellW + cellW / 2 - mp.x;
        const dy = rect.top + r * cellH + cellH / 2 - mp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS) {
          const force = REPEL_STRENGTH / (dist * dist + 1);
          const angle = Math.atan2(dy, dx);
          el.style.transform = `translate(${Math.cos(angle) * force}px, ${Math.sin(angle) * force}px)`;
          el.style.opacity = `${Math.max(0.2, dist / REPEL_RADIUS)}`;
        } else {
          el.style.transform = "translate(0px, 0px)";
          el.style.opacity = "1";
        }
      }, cellRefs.current);

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const setPointer = (x: number, y: number) => {
    mousePos.current = { x, y };
  };
  const clearPointer = () => {
    mousePos.current = null;
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: passive visual effect on page container
    <main
      className="fixed inset-0 overflow-hidden"
      onMouseMove={(e) => setPointer(e.clientX, e.clientY)}
      onMouseLeave={clearPointer}
      onTouchMove={(e) =>
        setPointer(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchEnd={clearPointer}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <div
          ref={containerRef}
          className="relative w-[min(448px,85vw)]"
          style={{ aspectRatio: `${COLS} / ${ROWS}` }}
          role="img"
          aria-label="404"
        >
          {GRID.flatMap((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const idx = r * COLS + c;
              const { x, y } = SCATTER_OFFSETS[idx];
              return (
                <span
                  key={idx}
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  className="absolute text-accent"
                  style={{
                    left: `${(c / COLS) * 100}%`,
                    top: `${(r / ROWS) * 100}%`,
                    width: `${(1 / COLS) * 100}%`,
                    height: `${(1 / ROWS) * 100}%`,
                    fontSize: "min(28px, calc(85vw / 16))",
                    lineHeight: "min(28px, calc(85vw / 16))",
                    transform: `translate(${x}px, ${y}px)`,
                    opacity: 0,
                    willChange: "transform, opacity",
                  }}
                >
                  █
                </span>
              );
            })
          )}
        </div>
        <p className="mt-12 text-lg text-accent">page not found</p>
        <ScrambleLink text="return home" href="/" />
      </div>
    </main>
  );
}
