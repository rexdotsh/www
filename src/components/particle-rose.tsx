import { useEffect, useRef } from "react";
import { ASCII_ROSE } from "@/lib/ascii-rose";
import { sfx } from "@/lib/sfx";

export type RoseMode =
  | "rest"
  | "cube"
  | "caret"
  | "shiver"
  | "garden"
  | "art"
  | "hi"
  | "paper";

type Rgb = [number, number, number];

interface Particle {
  activateAt: number;
  art?: Rgb;
  caretX: number;
  caretY: number;
  ch: string;
  cluster: number;
  color: string;
  cubeX: number;
  cubeY: number;
  cubeZ: number;
  docX: number;
  docY: number;
  gridX: number;
  gridY: number;
  hiX: number;
  hiY: number;
  homeX: number;
  homeY: number;
  ramp: number;
  rgb: Rgb;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const SPRING = 0.028;
const DAMPING = 0.86;
const REPEL_FORCE = 3.4;
const TAP_MS = 350;
const TAP_SLOP = 12;
const TAU = Math.PI * 2;

// canvas is BLEED× its layout box so waves/bursts overflow instead of clip
const BLEED = 1.24;

const BLUSH_RADIUS_RATIO = 0.26;
const BLUSH_STRENGTH = 0.8;

const GARDEN_CENTERS: [number, number][] = [
  [0.28, 0.3],
  [0.73, 0.26],
  [0.3, 0.74],
  [0.71, 0.7],
];
const GARDEN_SCALE = 0.34;

const RAMP_GLYPHS = ["@#S", "%?", "*+", ";:"];

// fallbacks for the css palette
const PALETTE_VARS: [string, Rgb][] = [
  ["--rose-0", [124, 16, 48]],
  ["--rose-1", [163, 18, 60]],
  ["--rose-2", [206, 41, 85]],
  ["--rose-3", [227, 92, 124]],
  ["--rose-4", [240, 160, 178]],
  ["--rose-glow", [239, 127, 154]],
];
const GLOW = PALETTE_VARS.length - 1;

const rampFor = (ch: string) => {
  const index = RAMP_GLYPHS.findIndex((glyphs) => glyphs.includes(ch));
  return index === -1 ? GLOW - 1 : index;
};
const toCss = ([r, g, b]: Rgb) => `rgb(${r},${g},${b})`;

// a probe element resolves the custom properties, light-dark() included
function readPalette(host: HTMLElement): Rgb[] {
  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
  host.appendChild(probe);
  const palette = PALETTE_VARS.map(([variable, fallback]): Rgb => {
    probe.style.color = `var(${variable})`;
    const channels = getComputedStyle(probe)
      .color.match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    return channels?.length === 3 ? (channels as Rgb) : fallback;
  });
  probe.remove();
  return palette;
}

function buildParticles(size: number, scattered: boolean): Particle[] {
  const lines = ASCII_ROSE.split("\n");
  const rows = lines.length;
  const cols = Math.max(...lines.map((line) => line.length));
  const inner = size / BLEED;
  const pad = (size - inner) / 2;
  const cellW = inner / cols;
  const cellH = inner / rows;
  const center = size / 2;
  const maxRadius = inner / 2;
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
      const radius = Math.hypot(homeX - center, homeY - center);
      const angle =
        Math.atan2(homeY - center, homeX - center) +
        (Math.random() - 0.5) * 1.7;
      particles.push({
        ch,
        cluster: particles.length % GARDEN_CENTERS.length,
        color: "",
        ramp: rampFor(ch),
        rgb: [0, 0, 0],
        homeX,
        homeY,
        gridX: homeX,
        gridY: homeY,
        docX: homeX,
        docY: homeY,
        caretX: homeX,
        caretY: homeY,
        cubeX: 0,
        cubeY: 0,
        cubeZ: 0,
        hiX: homeX,
        hiY: homeY,
        x: scattered ? center + Math.cos(angle) * radius * 0.18 : homeX,
        y: scattered ? center + Math.sin(angle) * radius * 0.18 : homeY,
        vx: 0,
        vy: 0,
        activateAt: scattered
          ? (radius / maxRadius) * 620 + Math.random() * 220
          : 0,
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

  // "paper": a page outline with ruled lines inside
  const c = size / 2;
  const pageW = inner * 0.58;
  const pageH = inner * 0.8;
  const x0 = c - pageW / 2;
  const y0 = c - pageH / 2;
  const outlineCount = Math.floor(particles.length * 0.55);
  const rules = [0.2, 0.36, 0.52, 0.68, 0.84];
  const perLine = Math.ceil((particles.length - outlineCount) / rules.length);

  particles.forEach((p, index) => {
    if (index < outlineCount) {
      const t = index / outlineCount;
      const perimeter = 2 * (pageW + pageH);
      const d = t * perimeter;
      if (d < pageW) {
        p.docX = x0 + d;
        p.docY = y0;
      } else if (d < pageW + pageH) {
        p.docX = x0 + pageW;
        p.docY = y0 + (d - pageW);
      } else if (d < pageW * 2 + pageH) {
        p.docX = x0 + pageW - (d - pageW - pageH);
        p.docY = y0 + pageH;
      } else {
        p.docX = x0;
        p.docY = y0 + pageH - (d - pageW * 2 - pageH);
      }
    } else {
      const i = index - outlineCount;
      const line = Math.min(Math.floor(i / perLine), rules.length - 1);
      const pos = (i % perLine) / perLine;
      // the last line ends short, like a paragraph
      const width = pageW * (line === rules.length - 1 ? 0.5 : 0.8);
      p.docX = x0 + pageW * 0.1 + pos * width;
      p.docY = y0 + pageH * rules[line];
    }
  });

  // "caret": a giant i-beam text cursor
  const stemH = inner * 0.56;
  const stemW = inner * 0.055;
  const barW = inner * 0.17;
  const barH = inner * 0.05;
  const stemCount = Math.floor(particles.length * 0.7);
  const barCount = Math.ceil((particles.length - stemCount) / 2);

  const fillRect = (
    p: Particle,
    i: number,
    count: number,
    w: number,
    h: number,
    cy: number
  ) => {
    const cols = Math.max(3, Math.round(Math.sqrt((count * w) / h)));
    const rows = Math.ceil(count / cols);
    p.caretX = c - w / 2 + ((i % cols) + 0.5) * (w / cols);
    p.caretY = cy - h / 2 + (Math.floor(i / cols) + 0.5) * (h / rows);
  };

  particles.forEach((p, index) => {
    if (index < stemCount) {
      fillRect(p, index, stemCount, stemW, stemH, c);
    } else if (index < stemCount + barCount) {
      fillRect(p, index - stemCount, barCount, barW, barH, c - stemH / 2);
    } else {
      fillRect(
        p,
        index - stemCount - barCount,
        barCount,
        barW,
        barH,
        c + stemH / 2
      );
    }
  });

  // "cube": distribute along the 12 edges of a unit cube
  const corners: [number, number, number][] = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        corners.push([x, y, z]);
      }
    }
  }
  const edges: [number, number][] = [];
  corners.forEach((a, i) => {
    corners.forEach((b, j) => {
      if (
        i < j &&
        Math.abs(a[0] - b[0]) +
          Math.abs(a[1] - b[1]) +
          Math.abs(a[2] - b[2]) ===
          2
      ) {
        edges.push([i, j]);
      }
    });
  });
  particles.forEach((p, index) => {
    const edge = index % edges.length;
    const [ai, bi] = edges[edge];
    const count =
      Math.floor(particles.length / edges.length) +
      (edge < particles.length % edges.length ? 1 : 0);
    const s = (Math.floor(index / edges.length) + 0.5) / count;
    p.cubeX = corners[ai][0] + (corners[bi][0] - corners[ai][0]) * s;
    p.cubeY = corners[ai][1] + (corners[bi][1] - corners[ai][1]) * s;
    p.cubeZ = corners[ai][2] + (corners[bi][2] - corners[ai][2]) * s;
  });

  // "hi": sample the word off a scratch canvas, like the album art trick
  const sampler = document.createElement("canvas");
  sampler.width = 240;
  sampler.height = 160;
  const sctx = sampler.getContext("2d");
  if (sctx) {
    sctx.font = "600 130px 'Geist Mono Variable', monospace";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText("hi", 120, 80);
    const { data } = sctx.getImageData(0, 0, 240, 160);
    const points: [number, number][] = [];
    for (let y = 0; y < 160; y += 2) {
      for (let x = 0; x < 240; x += 2) {
        if (data[(y * 240 + x) * 4 + 3] > 128) {
          points.push([x, y]);
        }
      }
    }
    if (points.length > 0) {
      const k = (inner * 0.72) / 240;
      particles.forEach((p, index) => {
        const [sx, sy] =
          points[Math.floor((index / particles.length) * points.length)];
        p.hiX = c + (sx - 120 + Math.random() * 2 - 1) * k;
        p.hiY = c + (sy - 80 + Math.random() * 2 - 1) * k;
      });
    }
  }

  return particles;
}

export default function ParticleRose({
  artFade = 0,
  artUrl = null,
  className = "",
  doze = false,
  mode = "rest",
  onHold,
  onTap,
  tappable = false,
}: {
  artFade?: number;
  artUrl?: string | null;
  className?: string;
  doze?: boolean;
  mode?: RoseMode;
  onHold?: (holding: boolean) => void;
  onTap?: () => void;
  tappable?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<RoseMode>(mode);
  modeRef.current = mode;
  const artFadeRef = useRef(artFade);
  artFadeRef.current = artFade;
  const dozeRef = useRef(doze);
  dozeRef.current = doze;
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onHoldRef = useRef(onHold);
  onHoldRef.current = onHold;
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
    let palette = readPalette(container);
    const pointer = { x: -9999, y: -9999 };

    const tint = () => {
      for (const p of particles) {
        p.rgb = palette[p.ramp];
        p.color = toCss(p.rgb);
      }
    };

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
          p.art = [data[o], data[o + 1], data[o + 2]];
        });
        hasArt = true;
      } catch {
        // canvas tainted — art mode falls back to a pulse
        for (const p of particles) {
          p.art = undefined;
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
      tint();
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
        case "cube": {
          // spin around y, fixed isometric tilt, orthographic projection
          const angle = t * 0.7;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x1 = p.cubeX * cos + p.cubeZ * sin;
          const z1 = -p.cubeX * sin + p.cubeZ * cos;
          const y1 = p.cubeY * 0.9135 - z1 * 0.4067;
          const scale = (size / BLEED) * 0.26;
          return [c + x1 * scale, c + y1 * scale];
        }
        case "caret":
          return [p.caretX, p.caretY];
        case "hi":
          return [p.hiX, p.hiY];
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

        case "paper":
          return [p.docX, p.docY];
        case "shiver":
          return [
            p.homeX + (Math.random() - 0.5) * 4,
            p.homeY + (Math.random() - 0.5) * 4,
          ];
        default:
          return [p.homeX, p.homeY];
      }
    };

    // idle life: a petal shed now and then
    let petal: {
      p: Particle;
      phase: "fall" | "return";
      startAt: number;
      x0: number;
      y0: number;
    } | null = null;
    let nextPetalAt = performance.now() + 9000 + Math.random() * 8000;
    let dozeLevel = 0;
    let heldSince = 0;
    let bloom = 0;

    const tick = (now: number) => {
      if (!startedAt) {
        startedAt = now;
      }
      const elapsed = now - startedAt;
      const t = now / 1000;
      dozeLevel += ((dozeRef.current ? 1 : 0) - dozeLevel) * 0.03;
      const opening = heldSince > 0 && now - heldSince > 180;
      bloom += ((opening ? 1 : 0) - bloom) * (opening ? 0.03 : 0.09);
      const spread = 1 + 0.42 * bloom;
      const spring = SPRING * (1 - 0.55 * dozeLevel);
      const sag = size * 0.025 * dozeLevel;
      const dim = 1 - 0.18 * dozeLevel;
      const repelRadius = size * 0.16;
      const blushRadius = size * BLUSH_RADIUS_RATIO;
      const [glowR, glowG, glowB] = palette[GLOW];
      const resting = modeRef.current === "rest";
      const artMode = modeRef.current === "art" && hasArt;
      const blink =
        modeRef.current === "caret"
          ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((t * TAU) / 1.2))
          : 1;
      context.font = artMode ? artFont : baseFont;
      context.clearRect(0, 0, size, size);

      if (resting && !petal && now > nextPetalAt) {
        const p = particles[Math.floor(Math.random() * particles.length)];
        petal = { p, phase: "fall", startAt: now, x0: p.x, y0: p.y };
      }
      if (petal && !resting) {
        petal = null;
        nextPetalAt = now + 9000 + Math.random() * 8000;
      }

      for (const p of particles) {
        if (elapsed < p.activateAt) {
          continue;
        }

        let alpha = Math.min(1, (elapsed - p.activateAt) / 350) * blink * dim;
        let blush = 0;

        if (petal?.p === p) {
          if (petal.phase === "fall") {
            const u = (now - petal.startAt) / 2800;
            if (u >= 1) {
              petal.phase = "return";
              petal.startAt = now;
              p.x = p.homeX;
              p.y = p.homeY;
              p.vx = 0;
              p.vy = 0;
              alpha = 0;
            } else {
              p.x = petal.x0 + Math.sin(u * TAU * 1.2) * size * 0.02;
              p.y = petal.y0 + u * u * size * 0.3;
              alpha *= 1 - u;
            }
          } else {
            const u = (now - petal.startAt) / 900;
            if (u >= 1) {
              petal = null;
              nextPetalAt = now + 14_000 + Math.random() * 10_000;
            } else {
              alpha *= u;
            }
          }
        } else {
          const [targetX, targetY] = targetFor(p, t);
          const c = size / 2;
          p.vx += (c + (targetX - c) * spread - p.x) * spring;
          p.vy += (c + (targetY - c) * spread + sag - p.y) * spring;
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < repelRadius && dist > 0.01) {
            const force = (1 - dist / repelRadius) * REPEL_FORCE;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
          blush = Math.max(
            dist < blushRadius ? (1 - dist / blushRadius) * BLUSH_STRENGTH : 0,
            0.4 * bloom
          );

          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        }

        context.globalAlpha = alpha;
        if (artMode && p.art) {
          const k = artFadeRef.current ** 1.5;
          const [r, g, b] = p.art;
          const [rr, rg, rb] = p.rgb;
          context.fillStyle = `rgb(${r + (rr - r) * k},${g + (rg - g) * k},${b + (rb - b) * k})`;
          context.fillText("#", p.x, p.y);
        } else if (blush > 0) {
          const [r, g, b] = p.rgb;
          context.fillStyle = `rgb(${r + (glowR - r) * blush},${g + (glowG - g) * blush},${b + (glowB - b) * blush})`;
          context.fillText(p.ch, p.x, p.y);
        } else {
          context.fillStyle = p.color;
          context.fillText(p.ch, p.x, p.y);
        }
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

    // the burst is immediate; the tap itself is called on release, because a
    // finger touching down is not yet a gesture the browser will play audio for
    let press: { at: number; x: number; y: number } | null = null;

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
      sfx("puff");
      press = { at: performance.now(), x: event.clientX, y: event.clientY };
      heldSince = press.at;
      onHoldRef.current?.(true);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!press) {
        return;
      }
      const quick = performance.now() - press.at < TAP_MS;
      const still =
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < TAP_SLOP;
      press = null;
      heldSince = 0;
      onHoldRef.current?.(false);
      if (bloom > 0.3) {
        sfx("puff");
      } else if (quick && still) {
        onTapRef.current?.();
      }
    };

    const onPointerCancel = () => {
      press = null;
      heldSince = 0;
      onHoldRef.current?.(false);
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
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    const onThemeChange = () => {
      palette = readPalette(container);
      tint();
      if (reduceMotion) {
        drawStatic();
      }
    };
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, []);

  useEffect(() => {
    loadArtRef.current(artUrl);
  }, [artUrl]);

  const inset = `${(((BLEED - 1) / 2) * 100).toFixed(0)}%`;

  return (
    <div
      className={`relative aspect-square ${tappable ? "cursor-pointer" : "cursor-crosshair"} ${className}`}
      ref={containerRef}
    >
      <canvas
        aria-label="An interactive rose made of ascii characters, move your cursor through it"
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
