"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

function getCellSize() {
  if (typeof window === "undefined") return 28;
  const vw = window.innerWidth;
  return vw < 480 ? Math.floor((vw * 0.85) / COLS) : 28;
}

export default function NotFoundPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number>(0);
  const [cs, setCs] = useState(28);

  useEffect(() => {
    setCs(getCellSize());
    const onResize = () => setCs(getCellSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const animate = useCallback(() => {
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
          className="relative"
          style={{ width: COLS * cs, height: ROWS * cs }}
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
                    left: c * cs,
                    top: r * cs,
                    width: cs,
                    height: cs,
                    fontSize: cs,
                    lineHeight: `${cs}px`,
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
