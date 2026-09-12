// Backdrop for the framed cut.
//
//   bun frame.ts               → out/frame-bg.png + out/frame-mask.png (variant BG, default 9)
//   BG=4 bun frame.ts          → pick a different gradient
//   bun frame.ts --gallery     → out/bg-gallery/index.html to compare all variants
//                                with real light/dark stills of the site inside

import { $ } from "bun";
import { chromium } from "playwright-core";

const OUT = new URL("./out/", import.meta.url).pathname;
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

export const FRAME = {
  width: 1920,
  height: 1080,
  // video placement inside the frame (16:9)
  inner: { width: 1792, height: 1008, radius: 18 },
};
export const INNER_X = (FRAME.width - FRAME.inner.width) / 2;
export const INNER_Y = (FRAME.height - FRAME.inner.height) / 2;

const t = (rgb: string) => `rgba(${rgb},0)`;

export const DEFAULT_BG = 9;

export const VARIANTS: Array<{ name: string; css: string; grain?: number }> = [
  {
    name: "rose → plum",
    css: `radial-gradient(60% 80% at 12% 8%, #f6c9d4 0%, ${t("246,201,212")} 60%),
      radial-gradient(55% 70% at 88% 92%, #2a0a14 0%, ${t("42,10,20")} 65%),
      radial-gradient(45% 55% at 78% 12%, #e5476d 0%, ${t("229,71,109")} 55%),
      radial-gradient(50% 60% at 20% 95%, #7c1030 0%, ${t("124,16,48")} 60%),
      linear-gradient(135deg, #c8183f 0%, #8e1236 55%, #4a0d22 100%)`,
  },
  {
    name: "wine, moody",
    css: `radial-gradient(70% 90% at 30% 20%, #9a1238 0%, ${t("154,18,56")} 60%),
      radial-gradient(60% 70% at 85% 85%, #e5476d 0%, ${t("229,71,109")} 45%),
      linear-gradient(160deg, #3a0a18 0%, #1a0509 100%)`,
  },
  {
    name: "paper pink, soft",
    css: `radial-gradient(60% 70% at 15% 15%, #fbe3e9 0%, ${t("251,227,233")} 60%),
      radial-gradient(50% 60% at 85% 80%, #f0a0b2 0%, ${t("240,160,178")} 60%),
      radial-gradient(40% 50% at 70% 10%, #e35c7c 0%, ${t("227,92,124")} 55%),
      linear-gradient(135deg, #f6d3db 0%, #e8899f 100%)`,
  },
  {
    name: "rose → charcoal (site dark)",
    css: `radial-gradient(65% 80% at 10% 10%, #e5476d 0%, ${t("229,71,109")} 60%),
      radial-gradient(50% 60% at 90% 90%, #b42f52 0%, ${t("180,47,82")} 55%),
      linear-gradient(135deg, #6b1030 0%, #2a1a1f 50%, #131315 100%)`,
  },
  {
    name: "sunset, warm",
    css: `radial-gradient(60% 70% at 15% 10%, #ffd0c2 0%, ${t("255,208,194")} 60%),
      radial-gradient(55% 65% at 85% 30%, #f48ca6 0%, ${t("244,140,166")} 55%),
      radial-gradient(60% 60% at 60% 100%, #7c1030 0%, ${t("124,16,48")} 60%),
      linear-gradient(160deg, #f0a06a 0%, #d43a62 50%, #5a0f2a 100%)`,
  },
  {
    name: "aubergine, cool",
    css: `radial-gradient(60% 75% at 20% 15%, #e5476d 0%, ${t("229,71,109")} 55%),
      radial-gradient(55% 65% at 85% 85%, #4a2a6b 0%, ${t("74,42,107")} 60%),
      radial-gradient(40% 50% at 75% 15%, #f48ca6 0%, ${t("244,140,166")} 50%),
      linear-gradient(135deg, #8e1236 0%, #4a1a4a 55%, #1f1230 100%)`,
  },
  {
    name: "ink with a rose glow",
    css: `radial-gradient(55% 70% at 20% 20%, #b3123a 0%, ${t("179,18,58")} 60%),
      radial-gradient(40% 50% at 80% 85%, #e5476d 0%, ${t("229,71,109")} 40%),
      linear-gradient(135deg, #2a2420 0%, #17140f 100%)`,
    grain: 0.4,
  },
  {
    name: "paper with rose bleed",
    css: `radial-gradient(45% 60% at 0% 0%, #e35c7c 0%, ${t("227,92,124")} 60%),
      radial-gradient(45% 60% at 100% 100%, #b3123a 0%, ${t("179,18,58")} 60%),
      radial-gradient(35% 45% at 100% 0%, #f0a0b2 0%, ${t("240,160,178")} 55%),
      linear-gradient(135deg, #faf8f2 0%, #f3e6e6 100%)`,
    grain: 0.35,
  },
  {
    name: "hot pink, punchy",
    css: `radial-gradient(60% 80% at 15% 10%, #ffb3c8 0%, ${t("255,179,200")} 55%),
      radial-gradient(60% 70% at 90% 90%, #7c1030 0%, ${t("124,16,48")} 60%),
      linear-gradient(135deg, #ff5c8a 0%, #e5476d 45%, #b3123a 100%)`,
  },
  {
    name: "plum spotlight (default)",
    css: `radial-gradient(85% 105% at 22% 0%, #f06a8c 0%, #c8183f 28%, #8e1236 48%, ${t("142,18,54")} 78%),
      radial-gradient(45% 55% at 92% 96%, #c8365c 0%, ${t("200,54,92")} 55%),
      linear-gradient(180deg, #4a0d22 0%, #23060f 100%)`,
    grain: 0.32,
  },
];

const grainUrl =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SHADOW = `box-shadow:
      0 36px 80px -20px rgba(20, 4, 10, .6),
      0 10px 24px -8px rgba(20, 4, 10, .4),
      0 0 0 1px rgba(255, 255, 255, .10);`;

const html = (
  variant: (typeof VARIANTS)[number],
  mask: boolean
) => `<!doctype html><html><head><style>
  html, body { margin: 0; width: ${FRAME.width}px; height: ${FRAME.height}px; overflow: hidden; }
  body { background: ${mask ? "#000" : variant.css}; }
  .grain { position: absolute; inset: 0; background: ${grainUrl}; mix-blend-mode: overlay; opacity: ${variant.grain ?? 0.28}; }
  .card {
    position: absolute;
    left: ${INNER_X}px; top: ${INNER_Y}px;
    width: ${FRAME.inner.width}px; height: ${FRAME.inner.height}px;
    border-radius: ${FRAME.inner.radius}px;
    background: ${mask ? "#fff" : "#000"};
    ${mask ? "" : SHADOW}
  }
</style></head><body>${mask ? "" : '<div class="grain"></div>'}<div class="card"></div></body></html>`;

// Review page: every variant, scaled down, with real stills of the site inside.
const gallery = (
  light: string,
  dark: string
) => `<!doctype html><html><head><meta charset="utf-8"><title>backdrops</title><style>
  body { margin: 0; padding: 40px; background: #0e0e10; color: #ddd; font: 13px/1.4 ui-monospace, monospace; }
  h1 { font-weight: 400; font-size: 14px; margin: 0 0 24px; color: #888; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 36px; }
  .label { grid-column: 1 / -1; color: #aaa; }
  .label b { color: #fff; font-weight: 500; }
  .frame { position: relative; aspect-ratio: 16 / 9; border-radius: 6px; overflow: hidden; }
  .frame .grain { position: absolute; inset: 0; background: ${grainUrl}; mix-blend-mode: overlay; }
  .frame img {
    position: absolute;
    left: ${(INNER_X / FRAME.width) * 100}%; top: ${(INNER_Y / FRAME.height) * 100}%;
    width: ${(FRAME.inner.width / FRAME.width) * 100}%; height: ${(FRAME.inner.height / FRAME.height) * 100}%;
    border-radius: 1.1%/2%;
    box-shadow: 0 12px 28px -8px rgba(20,4,10,.6), 0 0 0 1px rgba(255,255,255,.1);
  }
</style></head><body>
<h1>backdrops — pick a number, then <code>BG=n bun frame.ts && bun finish.ts</code></h1>
${VARIANTS.map(
  (v, i) => `<div class="row">
  <div class="label"><b>${i}</b> — ${v.name}</div>
  <div class="frame" style="background:${v.css.replace(/\s+/g, " ")}"><div class="grain" style="opacity:${v.grain ?? 0.28}"></div><img src="${light}" alt=""></div>
  <div class="frame" style="background:${v.css.replace(/\s+/g, " ")}"><div class="grain" style="opacity:${v.grain ?? 0.28}"></div><img src="${dark}" alt=""></div>
</div>`
).join("\n")}
</body></html>`;

if (import.meta.main) {
  if (process.argv.includes("--gallery")) {
    const dir = `${OUT}bg-gallery/`;
    // stills from the slow-motion raw: lead-in + effective seconds × slow
    const { slow } = (await Bun.file(`${OUT}timeline.json`).json()) as {
      slow: number;
    };
    const lead = 1.27;
    await $`mkdir -p ${dir}`;
    await $`ffmpeg -loglevel error -y -ss ${lead + 4.6 * slow} -i ${OUT}raw.mp4 -frames:v 1 -q:v 2 -vf scale=1600:-1 ${dir}still-light.jpg`;
    await $`ffmpeg -loglevel error -y -ss ${lead + 12.4 * slow} -i ${OUT}raw.mp4 -frames:v 1 -q:v 2 -vf scale=1600:-1 ${dir}still-dark.jpg`;
    await Bun.write(
      `${dir}index.html`,
      gallery("still-light.jpg", "still-dark.jpg")
    );
    console.error(`wrote ${dir}index.html`);
  } else {
    const variant =
      VARIANTS[Number(process.env.BG ?? DEFAULT_BG)] ?? VARIANTS[DEFAULT_BG];
    const browser = await chromium.launch({ executablePath: CHROME });
    const page = await browser.newPage({
      viewport: { width: FRAME.width, height: FRAME.height },
    });
    try {
      await page.setContent(html(variant, false));
      await page.screenshot({ path: `${OUT}frame-bg.png` });
      await page.setContent(html(variant, true));
      await page.screenshot({ path: `${OUT}frame-mask.png` });
      console.error(`wrote frame-bg.png, frame-mask.png (${variant.name})`);
    } finally {
      await browser.close();
    }
  }
}
