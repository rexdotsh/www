import { useEffect, useRef, useState } from "react";
import { COUNTS, ONLINE, RECENT } from "@/lib/mock-visitors";
import { sfx } from "@/lib/sfx";

const ROTATE_MS = 6000;

// Bottom-left corner note, the mirror of lights/sound top-right. Reads like
// a guestbook: who's here, who just left, and a very 1999 visitor number.
export default function Guestbook() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % RECENT.length),
      ROTATE_MS
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const latest = RECENT[mounted ? index : 0];

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: relays focus loss of the button and card inside it
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same; the interactive element is the button
    <span
      className="guestbook"
      data-open={open ? "" : undefined}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      ref={rootRef}
    >
      <span className="guestbook-peek" role="status">
        <span className="peek-card guestbook-card">
          <span className="peek-tab">recently</span>
          {RECENT.map((visitor) => (
            <span className="guest" key={`${visitor.place}-${visitor.ago}`}>
              <span className="guest-place">{visitor.place}</span>
              <span className="guest-page">{visitor.page}</span>
              <span className="guest-ago">{visitor.ago}</span>
            </span>
          ))}
          <span className="guest-foot">
            <span>
              {COUNTS.today} today · {COUNTS.week.toLocaleString("en-US")} this
              week
            </span>
            <span className="guest-no">
              you are visitor №{" "}
              <span className="tabular-nums">
                {COUNTS.visitorNumber.toLocaleString("en-US")}
              </span>
            </span>
          </span>
        </span>
      </span>

      <button
        aria-expanded={open}
        aria-label="who else is here"
        className="guestbook-line"
        onClick={() => {
          sfx(open ? "pause" : "pop");
          setOpen((v) => !v);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") {
            sfx("pop");
          }
        }}
        type="button"
      >
        <span aria-hidden="true" className="paren">
          (
        </span>{" "}
        <span className="guest-dot" />
        {ONLINE} here
        <span aria-hidden="true" className="text-faint">
          {" · "}
        </span>
        <span className="swap-in" key={latest.place}>
          last from {latest.place}, {latest.ago}
        </span>{" "}
        <span aria-hidden="true" className="paren">
          )
        </span>
      </button>
    </span>
  );
}
