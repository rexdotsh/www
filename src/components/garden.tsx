import { type CSSProperties, useEffect, useRef } from "react";
import { seededRandom } from "@/lib/utils";

const TAU = Math.PI * 2;
const STEP = 1 / 60;
const GRAVITY = 150;
const DRAG = 1.5;
const WIND = -18;
const MAX_PETALS = 40;

let layer: HTMLElement | null = null;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Integrated up front and handed to WAAPI, so the fall runs on the
// compositor with no loop of our own.
function flight(
  x0: number,
  y0: number,
  vx0: number,
  vy0: number,
  secs: number
) {
  const frames: Keyframe[] = [];
  let [x, y, vx, vy] = [x0, y0, vx0, vy0];
  const sway = rand(16, 38);
  const rate = rand(1.3, 2.8);
  const phase = rand(0, TAU);
  const spin = rand(140, 320) * (Math.random() < 0.5 ? -1 : 1);
  const axis = `${rand(0.3, 1).toFixed(2)},${rand(-0.6, 0.6).toFixed(2)},0`;
  let flip = rand(0, 360);
  for (let i = 0; i * STEP <= secs; i += 1) {
    const t = i * STEP;
    if (i % 6 === 0) {
      const rock = Math.sin(t * rate + phase) * 40;
      frames.push({
        opacity: Math.max(0, Math.min(1, t / 0.25, (secs - t) / 1.4)),
        transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${rock.toFixed(1)}deg) rotate3d(${axis},${flip.toFixed(0)}deg)`,
      });
    }
    vx += (WIND - vx) * DRAG * STEP;
    vy += (GRAVITY - vy * DRAG) * STEP;
    x += (vx + Math.cos(t * rate + phase) * sway) * STEP;
    y += vy * STEP;
    flip += spin * STEP;
  }
  return frames;
}

// Viewport coordinates. Only the homepage has a garden to shed into.
export function shed(x: number, y: number, count = 1, burst = 0) {
  if (!layer || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  for (let i = 0; i < count && layer.childElementCount < MAX_PETALS; i += 1) {
    const petal = document.createElement("i");
    petal.className = "petal";
    petal.dataset.tone = String(Math.floor(rand(0, 3)));
    petal.style.width = `${rand(12, 20).toFixed(1)}px`;
    layer.appendChild(petal);
    const angle = rand(-0.95, -0.05) * Math.PI;
    const speed = burst * rand(0.3, 1);
    const secs = rand(6, 9);
    petal.animate(
      flight(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, secs),
      { duration: secs * 1000, fill: "forwards" }
    ).onfinish = () => petal.remove();
  }
}

const FIREFLIES = (() => {
  const r = seededRandom(23);
  return Array.from(
    { length: 14 },
    () =>
      ({
        left: `${(3 + r() * 94).toFixed(1)}%`,
        top: `${(14 + r() * 80).toFixed(1)}%`,
        "--fx": `${(8 + r() * 9).toFixed(1)}s`,
        "--fy": `${(6 + r() * 8).toFixed(1)}s`,
        "--fb": `${(2.4 + r() * 3.2).toFixed(1)}s`,
        "--fd": `${(-r() * 14).toFixed(1)}s`,
        "--rx": `${Math.round(18 + r() * 54)}px`,
        "--ry": `${Math.round(12 + r() * 40)}px`,
      }) as CSSProperties
  );
})();

export default function Garden() {
  const petalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    layer = petalsRef.current;
    return () => {
      layer = null;
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="fireflies">
        {FIREFLIES.map((style, index) => (
          <i className="firefly" key={index} style={style}>
            <i>
              <i />
            </i>
          </i>
        ))}
      </div>
      <div aria-hidden="true" className="garden-petals" ref={petalsRef} />
    </>
  );
}
