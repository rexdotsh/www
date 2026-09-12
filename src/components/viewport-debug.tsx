import { useEffect, useState } from "react";

// `?debug` — viewport + safe-area readout for on-device layout debugging.
// Renders nothing otherwise.
export default function ViewportDebug() {
  const [info, setInfo] = useState<string[] | null>(null);

  useEffect(() => {
    if (!new URLSearchParams(location.search).has("debug")) {
      return;
    }
    const probe = (css: string) => {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;visibility:hidden;width:0;${css}`;
      document.body.appendChild(el);
      return el;
    };
    const safe = probe(
      "padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);height:100dvh"
    );
    const svh = probe("height:100svh");
    const lvh = probe("height:100lvh");

    const read = () => {
      const p = getComputedStyle(safe);
      const vv = window.visualViewport;
      const main = document.querySelector("main");
      const ms = main ? getComputedStyle(main) : null;
      setInfo([
        `inner ${innerHeight}  client ${document.documentElement.clientHeight}  screen ${screen.height}  dpr ${devicePixelRatio}`,
        `dvh ${safe.offsetHeight}  svh ${svh.offsetHeight}  lvh ${lvh.offsetHeight}`,
        `vv h ${vv ? Math.round(vv.height) : "-"}  top ${vv ? Math.round(vv.offsetTop) : "-"}  scale ${vv ? vv.scale.toFixed(2) : "-"}`,
        `safe-area top ${p.paddingTop}  bottom ${p.paddingBottom}`,
        `--bar-fade ${ms?.getPropertyValue("--bar-fade").trim() || "unset"}  --bar-fade-end ${ms?.getPropertyValue("--bar-fade-end").trim() || "unset"}`,
        `main bg-image ${ms?.backgroundImage === "none" ? "none (ios fade active)" : "set"}`,
        navigator.userAgent.replace(
          /^.*?\((.*?)\).*?(Version\/\S+|Chrome\/\S+)?.*$/,
          "$1 $2"
        ),
      ]);
    };
    read();
    addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    addEventListener("scroll", read, true);
    return () => {
      safe.remove();
      svh.remove();
      lvh.remove();
      removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
      removeEventListener("scroll", read, true);
    };
  }, []);

  if (!info) {
    return null;
  }

  const line = (label: string, style: React.CSSProperties) => (
    <div
      className="absolute right-0 left-0 border-t border-dashed"
      key={label}
      style={style}
    >
      <span className="absolute right-1 bottom-0 bg-black/70 px-1 text-[9px] text-white">
        {label}
      </span>
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] font-mono"
    >
      {line("safe-area-bottom", {
        bottom: "env(safe-area-inset-bottom)",
        borderColor: "red",
      })}
      {line("safe-area-top", {
        top: "env(safe-area-inset-top)",
        borderColor: "red",
      })}
      {line("fade end (flat below)", {
        bottom: "var(--bar-fade-end, 0px)",
        borderColor: "blue",
      })}
      {line("fade start", {
        bottom: "calc(var(--bar-fade-end, 0px) + var(--bar-fade, 0px))",
        borderColor: "blue",
      })}
      {line("100svh", { top: "100svh", borderColor: "green" })}
      {line("100lvh", { top: "100lvh", borderColor: "green" })}
      {line("visualViewport bottom", {
        top: `${(window.visualViewport?.offsetTop ?? 0) + (window.visualViewport?.height ?? 0)}px`,
        borderColor: "orange",
      })}
      <pre className="absolute top-[max(3rem,env(safe-area-inset-top))] left-2 whitespace-pre-wrap bg-black/70 p-2 text-[10px] text-white leading-tight">
        {info.join("\n")}
      </pre>
    </div>
  );
}
