"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

const ASCII_404 = [
  [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
];

const ROWS = ASCII_404.length;
const COLS = ASCII_404[0].length;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 4000;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16_807 + 0) % 2_147_483_647;
    return (s - 1) / 2_147_483_646;
  };
}

function generateScatterOffsets() {
  const rand = seededRandom(404);
  const offsets: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      offsets.push({
        x: (rand() - 0.5) * 600,
        y: (rand() - 0.5) * 400,
      });
    }
  }
  return offsets;
}

const SCATTER_OFFSETS = generateScatterOffsets();

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number>(0);
  const assembled = useRef(false);

  useEffect(() => {
    const cells = cellRefs.current;

    const timeout = setTimeout(() => {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!ASCII_404[r][c]) continue;
          const el = cells[r * COLS + c];
          if (!el) continue;
          el.style.transition =
            "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out";
          el.style.transform = "translate(0px, 0px)";
          el.style.opacity = "1";
        }
      }

      const resetTimeout = setTimeout(() => {
        assembled.current = true;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (!ASCII_404[r][c]) continue;
            const el = cells[r * COLS + c];
            if (!el) continue;
            el.style.transition =
              "transform 0.3s ease-out, opacity 0.3s ease-out";
          }
        }
      }, 900);

      return () => clearTimeout(resetTimeout);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const animate = useCallback(() => {
    if (!assembled.current) {
      rafId.current = requestAnimationFrame(animate);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cells = cellRefs.current;
    const cellW = rect.width / COLS;
    const cellH = rect.height / ROWS;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!ASCII_404[r][c]) continue;
        const el = cells[r * COLS + c];
        if (!el) continue;

        const mp = mousePos.current;
        if (!mp) {
          el.style.transform = "translate(0px, 0px)";
          el.style.opacity = "1";
          continue;
        }

        const cx = rect.left + c * cellW + cellW / 2;
        const cy = rect.top + r * cellH + cellH / 2;
        const dx = cx - mp.x;
        const dy = cy - mp.y;
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
      }
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    mousePos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(() => {
    mousePos.current = null;
  }, []);

  return (
    // biome-ignore lint: passive visual effect on page container
    <div
      role="main"
      className="fixed inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <div
          ref={containerRef}
          className="relative w-[min(448px,85vw)]"
          style={{ aspectRatio: `${COLS} / ${ROWS}` }}
          role="img"
          aria-label="404"
        >
          {ASCII_404.flatMap((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const idx = r * COLS + c;
              const offset = SCATTER_OFFSETS[idx];
              return (
                <span
                  key={idx}
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  className="absolute text-primary"
                  style={{
                    left: `${(c / COLS) * 100}%`,
                    top: `${(r / ROWS) * 100}%`,
                    width: `${(1 / COLS) * 100}%`,
                    height: `${(1 / ROWS) * 100}%`,
                    fontSize: "min(28px, calc(85vw / 16))",
                    lineHeight: "min(28px, calc(85vw / 16))",
                    transform: `translate(${offset.x}px, ${offset.y}px)`,
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
        <p className="mt-6 text-lg text-primary">page not found</p>
        <Link
          className="mt-4 text-lg text-secondary transition-colors duration-200 hover:text-primary"
          href="/"
        >
          return home
        </Link>
      </div>
    </div>
  );
}
