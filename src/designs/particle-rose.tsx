import { useEffect, useRef } from "react";
import { ASCII_ROSE } from "@/lib/ascii-rose";

interface Particle {
  activateAt: number;
  ch: string;
  color: string;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const SPRING = 0.028;
const DAMPING = 0.86;
const REPEL_FORCE = 3.4;

function colorFor(ch: string): string {
  if ("@#S".includes(ch)) {
    return "#7c1030";
  }
  if ("%?".includes(ch)) {
    return "#a3123c";
  }
  if ("*+".includes(ch)) {
    return "#ce2955";
  }
  if (";:".includes(ch)) {
    return "#e35c7c";
  }
  return "#f0a0b2";
}

function buildParticles(size: number, scattered: boolean): Particle[] {
  const lines = ASCII_ROSE.split("\n");
  const rows = lines.length;
  const cols = Math.max(...lines.map((line) => line.length));
  const cellW = size / cols;
  const cellH = size / rows;
  const offsetY = (size - rows * cellH) / 2;
  const particles: Particle[] = [];

  for (let row = 0; row < rows; row += 1) {
    const line = lines[row];
    for (let col = 0; col < line.length; col += 1) {
      const ch = line[col];
      if (ch === " ") {
        continue;
      }
      const homeX = col * cellW + cellW / 2;
      const homeY = offsetY + row * cellH + cellH / 2;
      particles.push({
        ch,
        color: colorFor(ch),
        homeX,
        homeY,
        x: scattered ? Math.random() * size : homeX,
        y: scattered ? Math.random() * size : homeY,
        vx: 0,
        vy: 0,
        activateAt: scattered ? Math.random() * 900 : 0,
      });
    }
  }
  return particles;
}

/**
 * the rose, rebuilt from ~700 glyph particles with spring physics.
 * size follows the parent container (keep it square via aspect-square).
 * pointer repels particles from anywhere on the page; clicking the
 * canvas bursts them outward. respects prefers-reduced-motion.
 */
export default function ParticleRose({
  className = "",
  onTouch,
}: {
  className?: string;
  onTouch?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onTouchRef = useRef(onTouch);
  onTouchRef.current = onTouch;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!(canvas && container)) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let particles: Particle[] = [];
    let size = 0;
    let dpr = 1;
    let raf = 0;
    let startedAt = 0;
    const pointer = { x: -9999, y: -9999 };

    const setup = (scattered: boolean) => {
      size = container.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(size, scattered && !reduceMotion);
      const rows = ASCII_ROSE.split("\n").length;
      context.font = `600 ${(size / rows) * 1.05}px "Geist Mono Variable", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
    };

    const drawStatic = () => {
      context.clearRect(0, 0, size, size);
      for (const p of particles) {
        context.fillStyle = p.color;
        context.fillText(p.ch, p.homeX, p.homeY);
      }
    };

    const tick = (now: number) => {
      if (!startedAt) {
        startedAt = now;
      }
      const elapsed = now - startedAt;
      const repelRadius = size * 0.16;
      context.clearRect(0, 0, size, size);

      for (const p of particles) {
        if (elapsed < p.activateAt) {
          continue;
        }

        // spring home
        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;

        // repel from pointer
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < repelRadius && dist > 0.01) {
          const force = (1 - dist / repelRadius) * REPEL_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        const alpha = Math.min(1, (elapsed - p.activateAt) / 350);
        context.globalAlpha = alpha;
        context.fillStyle = p.color;
        context.fillText(p.ch, p.x, p.y);
      }
      context.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      setup(true);
      if (reduceMotion) {
        drawStatic();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerMove = (event: PointerEvent) => {
      const local = toLocal(event);
      pointer.x = local.x;
      pointer.y = local.y;
      if (local.x > 0 && local.y > 0 && local.x < size && local.y < size) {
        onTouchRef.current?.();
      }
    };

    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const onPointerDown = (event: PointerEvent) => {
      const local = toLocal(event);
      const burstRadius = size * 0.38;
      for (const p of particles) {
        const dx = p.x - local.x;
        const dy = p.y - local.y;
        const dist = Math.hypot(dx, dy);
        if (dist < burstRadius && dist > 0.01) {
          const force = (1 - dist / burstRadius) * 22;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
      onTouchRef.current?.();
    };

    const onResize = () => {
      if (container.clientWidth !== size) {
        cancelAnimationFrame(raf);
        setup(false);
        if (reduceMotion) {
          drawStatic();
        } else {
          startedAt = 0;
          raf = requestAnimationFrame(tick);
        }
      }
    };

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) {
        start();
      }
    });

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className={`cursor-crosshair ${className}`} ref={containerRef}>
      <canvas
        aria-label="An interactive rose made of ascii characters — move your cursor through it"
        className="block aspect-square h-auto w-full touch-none"
        ref={canvasRef}
        role="img"
      />
    </div>
  );
}
