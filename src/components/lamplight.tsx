import { useEffect, useRef } from "react";

const EASE = 0.16;

// With the lights off, the pointer carries a lamp. It trails a little, the
// way a held light does.
export default function Lamplight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lamp = ref.current;
    if (!(lamp && matchMedia("(hover: hover) and (pointer: fine)").matches)) {
      return;
    }
    let frame = 0;
    let x = 0;
    let y = 0;
    let lit: { x: number; y: number } | null = null;

    const step = () => {
      if (!lit) {
        frame = 0;
        return;
      }
      lit.x += (x - lit.x) * EASE;
      lit.y += (y - lit.y) * EASE;
      lamp.style.translate = `${lit.x}px ${lit.y}px`;
      frame =
        Math.abs(x - lit.x) + Math.abs(y - lit.y) > 0.5
          ? requestAnimationFrame(step)
          : 0;
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!lit) {
        lit = { x, y };
        lamp.dataset.lit = "";
      }
      frame ||= requestAnimationFrame(step);
    };
    const onLeave = () => {
      lit = null;
      delete lamp.dataset.lit;
    };

    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div aria-hidden="true" className="lamplight" ref={ref} />;
}
