import { useEffect, useRef } from "react";
import { ASCII_ROSE } from "@/lib/ascii-rose";

export type RoseMode =
  | "rest"
  | "grid"
  | "lean"
  | "shiver"
  | "garden"
  | "art"
  | "wave"
  | "lines";

interface Particle {
  activateAt: number;
  artColor?: string;
  ch: string;
  cluster: number;
  color: string;
  gridX: number;
  gridY: number;
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
const TAU = Math.PI * 2;

// canvas is BLEED× its layout box so waves/bursts overflow instead of clip
const BLEED = 1.24;

const GARDEN_CENTERS: [number, number][] = [
  [0.28, 0.3],
  [0.73, 0.26],
  [0.3, 0.74],
  [0.71, 0.7],
];
const GARDEN_SCALE = 0.34;

const RAMP: [string, string][] = [
  ["@#S", "#7c1030"],
  ["%?", "#a3123c"],
  ["*+", "#ce2955"],
  [";:", "#e35c7c"],
];
const colorFor = (ch: string) =>
  RAMP.find(([glyphs]) => glyphs.includes(ch))?.[1] ?? "#f0a0b2";

function buildParticles(size: number, scattered: boolean): Particle[] {
  const lines = ASCII_ROSE.split("\n");
  const rows = lines.length;
  const cols = Math.max(...lines.map((line) => line.length));
  const inner = size / BLEED;
  const pad = (size - inner) / 2;
  const cellW = inner / cols;
  const cellH = inner / rows;
  const particles: Particle[] = [];

  for (let row = 0; row < rows; row += 1) {
    const line = lines[row];
    for (let col = 0; col < line.length; col += 1) {
      const ch = line[col];
      if (ch === " ") {
        continue;
      }
      const homeX = pad + col * cellW + cellW / 2;
      const homeY = pad + row * cellH + cellH / 2;
      particles.push({
        ch,
        cluster: particles.length % GARDEN_CENTERS.length,
        color: colorFor(ch),
        homeX,
        homeY,
        gridX: homeX,
        gridY: homeY,
        x: scattered ? Math.random() * size : homeX,
        y: scattered ? Math.random() * size : homeY,
        vx: 0,
        vy: 0,
        activateAt: scattered ? Math.random() * 900 : 0,
      });
    }
  }

  const g = Math.ceil(Math.sqrt(particles.length));
  const gridCell = (inner * 0.95) / g;
  const gridOffset = (size - inner * 0.95) / 2;
  particles.forEach((p, index) => {
    p.gridX = gridOffset + ((index % g) + 0.5) * gridCell;
    p.gridY = gridOffset + (Math.floor(index / g) + 0.5) * gridCell;
  });

  return particles;
}

export default function ParticleRose({
  artUrl = null,
  className = "",
  mode = "rest",
}: {
  artUrl?: string | null;
  className?: string;
  mode?: RoseMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<RoseMode>(mode);
  modeRef.current = mode;
  const loadArtRef = useRef<(url: string | null) => void>(() => undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext("2d");
    if (!(canvas && container && context)) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let particles: Particle[] = [];
    let size = 0;
    let raf = 0;
    let startedAt = 0;
    let hasArt = false;
    let artImage: HTMLImageElement | null = null;
    let baseFont = "";
    let artFont = "";
    const pointer = { x: -9999, y: -9999 };

    const applyArt = () => {
      hasArt = false;
      if (!artImage || particles.length === 0) {
        return;
      }
      const g = Math.ceil(Math.sqrt(particles.length));
      try {
        const sampler = document.createElement("canvas");
        sampler.width = g;
        sampler.height = g;
        const samplerContext = sampler.getContext("2d");
        if (!samplerContext) {
          return;
        }
        samplerContext.drawImage(artImage, 0, 0, g, g);
        const { data } = samplerContext.getImageData(0, 0, g, g);
        particles.forEach((p, index) => {
          const o = index * 4;
          p.artColor = `rgb(${data[o]},${data[o + 1]},${data[o + 2]})`;
        });
        hasArt = true;
      } catch {
        // canvas tainted — art mode falls back to a pulse
        for (const p of particles) {
          p.artColor = undefined;
        }
      }
    };

    loadArtRef.current = (url) => {
      artImage = null;
      hasArt = false;
      if (!url) {
        return;
      }
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        artImage = image;
        applyArt();
      };
      image.src = url;
    };

    const setup = (scattered: boolean) => {
      size = container.clientWidth * BLEED;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(size, scattered && !reduceMotion);
      const rows = ASCII_ROSE.split("\n").length;
      const inner = size / BLEED;
      const gridCell = (inner * 0.95) / Math.ceil(Math.sqrt(particles.length));
      baseFont = `600 ${(inner / rows) * 1.05}px "Geist Mono Variable", monospace`;
      artFont = `700 ${gridCell * 1.5}px "Geist Mono Variable", monospace`;
      context.font = baseFont;
      context.textAlign = "center";
      context.textBaseline = "middle";
      applyArt();
    };

    const drawStatic = () => {
      context.clearRect(0, 0, size, size);
      for (const p of particles) {
        context.fillStyle = p.color;
        context.fillText(p.ch, p.homeX, p.homeY);
      }
    };

    const targetFor = (p: Particle, t: number): [number, number] => {
      const c = size / 2;
      const dx = p.homeX - c;
      const dy = p.homeY - c;

      switch (modeRef.current) {
        case "grid":
          return [p.gridX, p.gridY];
        case "art": {
          if (hasArt) {
            return [p.gridX, p.gridY];
          }
          const s = 1 + 0.07 * Math.sin(t * TAU * 1.35);
          return [c + dx * s, c + dy * s];
        }
        case "garden": {
          const [gx, gy] = GARDEN_CENTERS[p.cluster];
          return [gx * size + dx * GARDEN_SCALE, gy * size + dy * GARDEN_SCALE];
        }
        case "lean":
          return [p.homeX - dy * 0.3, p.homeY];
        case "wave":
          return [
            p.homeX,
            p.homeY +
              Math.sin((p.homeX / size) * TAU * 1.4 + t * 5) * size * 0.024,
          ];
        case "lines":
          return [
            c + dx * 1.05,
            ((Math.floor((p.homeY / size) * 9) + 0.5) / 9) * size,
          ];
        case "shiver":
          return [
            p.homeX + (Math.random() - 0.5) * 4,
            p.homeY + (Math.random() - 0.5) * 4,
          ];
        default:
          return [p.homeX, p.homeY];
      }
    };

    const tick = (now: number) => {
      if (!startedAt) {
        startedAt = now;
      }
      const elapsed = now - startedAt;
      const t = now / 1000;
      const repelRadius = size * 0.16;
      const artMode = modeRef.current === "art" && hasArt;
      context.font = artMode ? artFont : baseFont;
      context.clearRect(0, 0, size, size);

      for (const p of particles) {
        if (elapsed < p.activateAt) {
          continue;
        }

        const [targetX, targetY] = targetFor(p, t);
        p.vx += (targetX - p.x) * SPRING;
        p.vy += (targetY - p.y) * SPRING;

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

        context.globalAlpha = Math.min(1, (elapsed - p.activateAt) / 350);
        context.fillStyle = artMode && p.artColor ? p.artColor : p.color;
        context.fillText(artMode && p.artColor ? "#" : p.ch, p.x, p.y);
      }
      context.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const restart = (scattered: boolean) => {
      cancelAnimationFrame(raf);
      setup(scattered);
      if (reduceMotion) {
        drawStatic();
      } else {
        startedAt = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerMove = (event: PointerEvent) => {
      const local = toLocal(event);
      pointer.x = local.x;
      pointer.y = local.y;
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
    };

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) {
        restart(true);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth * BLEED !== size) {
        restart(false);
      }
    });
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

  useEffect(() => {
    loadArtRef.current(artUrl);
  }, [artUrl]);

  const inset = `${(((BLEED - 1) / 2) * 100).toFixed(0)}%`;

  return (
    <div
      className={`relative aspect-square cursor-crosshair ${className}`}
      ref={containerRef}
    >
      <canvas
        aria-label="An interactive rose made of ascii characters — move your cursor through it"
        className="absolute block touch-none"
        ref={canvasRef}
        role="img"
        style={{
          top: `-${inset}`,
          left: `-${inset}`,
          width: `${BLEED * 100}%`,
          height: `${BLEED * 100}%`,
        }}
      />
    </div>
  );
}
