"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

// Block-letter "404" — each sub-array is a row, 1 = filled, 0 = empty
// Letters are 5 tall x 4 wide, with 2-col gaps between them
const ASCII_404 = [
  [1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
];

const ROWS = ASCII_404.length;
const COLS = ASCII_404[0].length;
const CELL_SIZE = 28;
const REPEL_RADIUS = 120;
const REPEL_STRENGTH = 4000;

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number>(0);

  const animate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cells = cellRefs.current;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!ASCII_404[r][c]) continue;
        const idx = r * COLS + c;
        const el = cells[idx];
        if (!el) continue;

        const mp = mousePos.current;
        if (!mp) {
          el.style.transform = "translate(0px, 0px)";
          el.style.opacity = "1";
          continue;
        }

        const cx = rect.left + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = rect.top + r * CELL_SIZE + CELL_SIZE / 2;
        const dx = cx - mp.x;
        const dy = cy - mp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS) {
          const force = REPEL_STRENGTH / (dist * dist + 1);
          const angle = Math.atan2(dy, dx);
          const tx = Math.cos(angle) * force;
          const ty = Math.sin(angle) * force;
          el.style.transform = `translate(${tx}px, ${ty}px)`;
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
          className="relative"
          style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}
          role="img"
          aria-label="404"
        >
          {ASCII_404.flatMap((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const idx = r * COLS + c;
              return (
                <span
                  key={idx}
                  ref={(el) => {
                    cellRefs.current[idx] = el;
                  }}
                  className="absolute text-primary"
                  style={{
                    left: c * CELL_SIZE,
                    top: r * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    fontSize: CELL_SIZE,
                    lineHeight: `${CELL_SIZE}px`,
                    transition:
                      "transform 0.3s ease-out, opacity 0.3s ease-out",
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
