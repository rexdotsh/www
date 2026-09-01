import { useEffect, useRef, useState } from "react";
import { ASCII_ROSE } from "@/lib/ascii-rose";
import { getIdentity, getNavLinks } from "@/lib/content";
import { useNowPlaying } from "@/lib/use-now-playing";

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
 * design 1 — "bloom"
 * the classic site, remastered: the rose rebuilt from ~700 glyph
 * particles with spring physics. scatter it, it finds its way home.
 */
export default function BloomDesign({ hostname }: { hostname: string }) {
  const identity = getIdentity(hostname);
  const links = getNavLinks(hostname);
  const { track } = useNowPlaying();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);

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
        setTouched(true);
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
      setTouched(true);
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
    <main className="fixed inset-0 overflow-hidden bg-[#f6f3ec] font-mono text-[#4a443b] selection:bg-[#ce2955] selection:text-[#f6f3ec]">
      {/* top chrome */}
      <h1 className="absolute top-5 left-5 text-[11px] uppercase tracking-[0.25em]">
        <span className="font-bold text-[#1f1b16]">{identity.name}</span>
        <span className="text-[#9b9284]"> — {identity.tagline}</span>
      </h1>
      <p className="absolute top-5 right-5 hidden text-[#9b9284] text-[11px] tabular-nums tracking-[0.25em] md:block">
        est. 2025
      </p>

      {/* the artwork */}
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div
            className="w-[min(88vw,520px)] cursor-crosshair"
            ref={containerRef}
          >
            <canvas
              aria-label="An interactive rose made of ascii characters — move your cursor through it"
              className="block aspect-square h-auto w-full touch-none"
              ref={canvasRef}
              role="img"
            />
          </div>
          <p
            aria-hidden="true"
            className={`mt-2 text-[#9b9284] text-[11px] italic transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-70"}`}
          >
            ( touch it )
          </p>
        </div>
      </div>

      {/* bottom chrome */}
      <nav
        aria-label="primary"
        className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-6 md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:items-start md:gap-4"
      >
        {links.map(({ href, label }) => (
          <a
            className="text-[11px] uppercase tracking-[0.25em] text-[#4a443b] underline decoration-transparent underline-offset-4 transition-[color,text-decoration-color] duration-150 hover:text-[#ce2955] hover:decoration-[#ce2955]"
            href={href}
            key={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        ))}
      </nav>

      <p className="absolute bottom-5 left-5 hidden max-w-[40ch] truncate text-[#9b9284] text-[11px] tracking-[0.15em] md:block">
        {track
          ? `♫ ${track.artist} — ${track.name}`
          : `© ${new Date().getFullYear()}`}
      </p>
    </main>
  );
}
