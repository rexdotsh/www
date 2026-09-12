import { type CSSProperties, useEffect, useState } from "react";

// PR-only viewport/safe-area readout for on-device layout debugging (?debug).
// Knobs: ?fade=<len> (--bar-fade, 0 = off) ?glow=full ?lift=<px> ?hide
export default function ViewportDebug() {
  const [info, setInfo] = useState<string[] | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [vvBottom, setVvBottom] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (!q.has("debug")) {
      return;
    }
    const html = document.documentElement;
    if (q.has("fade")) {
      html.style.setProperty("--bar-fade", q.get("fade") || "0px");
    }
    if (q.get("glow") === "full") {
      html.dataset.glow = "full";
    }
    if (q.has("lift")) {
      html.style.setProperty(
        "--sheet-bottom",
        `calc(max(1.5rem, env(safe-area-inset-bottom)) + ${q.get("lift") || 0}px)`
      );
    }
    if (q.has("hide")) {
      setCollapsed(true);
    }

    const probe = (css: string) => {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;visibility:hidden;width:0;${css}`;
      document.body.appendChild(el);
      return el;
    };
    const safe = probe(
      "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);height:100dvh"
    );
    const svh = probe("height:100svh");
    const lvh = probe("height:100lvh");
    const rect = (sel: string) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r
        ? `top ${Math.round(r.top)} bot ${Math.round(r.bottom)} (${Math.round(innerHeight - r.bottom)} from edge) w ${Math.round(r.width)}`
        : "—";
    };
    const mq = (m: string) => (matchMedia(m).matches ? "y" : "n");

    let n = 0;
    const read = () => {
      n += 1;
      const p = getComputedStyle(safe);
      const vv = window.visualViewport;
      const main = document.querySelector("main");
      const ms = main ? getComputedStyle(main) : null;
      const before = main ? getComputedStyle(main, "::before") : null;
      const strip = document.querySelector(".tint-strip-bottom");
      const ss = strip ? getComputedStyle(strip) : null;
      const html = getComputedStyle(document.documentElement);
      setVvBottom(vv ? vv.offsetTop + vv.height : innerHeight);
      setInfo([
        `#${n}  ${new Date().toLocaleTimeString()}`,
        `window  inner ${innerWidth}×${innerHeight}  outer ${outerWidth}×${outerHeight}  screen ${screen.width}×${screen.height}  dpr ${devicePixelRatio}`,
        `html    client ${document.documentElement.clientWidth}×${document.documentElement.clientHeight}  scrollH ${document.documentElement.scrollHeight}  scrollY ${Math.round(scrollY)}`,
        `units   dvh ${safe.offsetHeight}  svh ${svh.offsetHeight}  lvh ${lvh.offsetHeight}`,
        `vv      ${vv ? `${Math.round(vv.width)}×${Math.round(vv.height)}  off ${Math.round(vv.offsetLeft)},${Math.round(vv.offsetTop)}  page ${Math.round(vv.pageLeft)},${Math.round(vv.pageTop)}  scale ${vv.scale.toFixed(2)}` : "n/a"}`,
        `safe    t ${p.paddingTop} r ${p.paddingRight} b ${p.paddingBottom} l ${p.paddingLeft}`,
        `main    ${main ? `${ms?.position}  ${Math.round(main.clientWidth)}×${Math.round(main.clientHeight)}  scrollH ${main.scrollHeight}  scrollTop ${Math.round(main.scrollTop)}  bg ${ms?.backgroundColor}` : "—"}`,
        `        bg-image ${ms?.backgroundImage === "none" ? "none → ios fade layer active" : "on main (fade layer NOT active)"}`,
        `fade    --bar-fade ${ms?.getPropertyValue("--bar-fade").trim() || "unset"}  ::before ${before?.position} z ${before?.zIndex}  mask ${before?.maskImage === "none" ? "none" : "set"}`,
        `strip   ${strip ? `${ss?.display} ${rect(".tint-strip-bottom")}  bg ${ss?.backgroundColor}` : "—"}`,
        `--bg    ${html.getPropertyValue("--background").trim()}  scheme ${html.colorScheme}  theme ${document.documentElement.dataset.theme ?? "light"}`,
        `sheets  --sheet-bottom ${html.getPropertyValue("--sheet-bottom").trim()}  glow ${document.documentElement.dataset.glow ?? "clamped(mobile)"}`,
        `peek    ${rect(".peek-trigger[data-peek-open] .peek")}`,
        `gbook   ${rect(".guestbook[data-open] .guestbook-peek")}`,
        `media   hover ${mq("(hover: hover)")} fine ${mq("(pointer: fine)")} dark ${mq("(prefers-color-scheme: dark)")} standalone ${mq("(display-mode: standalone)")} ≤767 ${mq("(max-width: 767px)")}`,
        `ua      ${navigator.userAgent
          .replace(/^Mozilla\/5\.0 \(/, "")
          .replace(/\) AppleWebKit.*Version\//, ") Safari ")
          .replace(/ Mobile.*$/, "")}`,
      ]);
    };
    read();
    const targets: [EventTarget | null, string][] = [
      [window, "resize"],
      [window, "orientationchange"],
      [window.visualViewport, "resize"],
      [window.visualViewport, "scroll"],
      [document, "pointerup"],
      [document, "focusin"],
      [document, "focusout"],
    ];
    for (const [t, ev] of targets) {
      t?.addEventListener(ev, read);
    }
    addEventListener("scroll", read, true);
    const timer = setInterval(read, 1000);
    return () => {
      safe.remove();
      svh.remove();
      lvh.remove();
      for (const [t, ev] of targets) {
        t?.removeEventListener(ev, read);
      }
      removeEventListener("scroll", read, true);
      clearInterval(timer);
    };
  }, []);

  if (!info) {
    return null;
  }

  const line = (label: string, style: CSSProperties, side = "right") => (
    <div
      className="absolute right-0 left-0 border-t border-dashed"
      key={label}
      style={style}
    >
      <span
        className={`absolute bottom-0 bg-black/70 px-1 text-[9px] text-white ${side === "left" ? "left-1" : "right-1"}`}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] font-mono"
    >
      {line("safe-area-top", {
        top: "env(safe-area-inset-top)",
        borderColor: "red",
      })}
      {line("safe-area-bottom", {
        bottom: "env(safe-area-inset-bottom)",
        borderColor: "red",
      })}
      {line("fade start", {
        bottom: "var(--bar-fade, 0px)",
        borderColor: "blue",
      })}
      {line(
        "sheet bottom",
        {
          bottom: "var(--sheet-bottom)",
          borderColor: "magenta",
        },
        "left"
      )}
      {line("100svh", { top: "100svh", borderColor: "green" })}
      {line("100lvh", { top: "100lvh", borderColor: "green" }, "left")}
      {line("visualViewport bottom", {
        top: `${vvBottom}px`,
        borderColor: "orange",
      })}
      {/* Where Safari samples its bar tint from (the strip itself is masked). */}
      <div
        className="absolute right-0 bottom-0 left-0 h-[12px] border border-cyan-400 border-dashed"
        title="tint-strip-bottom"
      />
      <button
        className="pointer-events-auto absolute top-[max(3rem,env(safe-area-inset-top))] left-2 max-w-[calc(100vw-1rem)] whitespace-pre-wrap bg-black/75 p-2 text-left text-[9px] text-white leading-[1.25]"
        onClick={() => setCollapsed((c) => !c)}
        type="button"
      >
        {collapsed ? "debug ▸" : info.join("\n")}
      </button>
    </div>
  );
}
