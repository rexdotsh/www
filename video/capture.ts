// Records a scripted walkthrough of the homepage under Xvfb.
//
//   bun run preview -- --port 4173   (in another shell)
//   bun run capture && bun run finish
//
// The page runs in slow motion (SLOW×, default 4): performance.now / rAF /
// timers are scaled by an init script and the CSS animation timeline via CDP,
// so software Chromium has SLOW× the time to paint each frame. finish.ts
// speeds the footage back up. rAF is throttled to 60 *effective* fps because
// the rose's spring physics step per frame, not per ms.
//
// Output: out/raw.mp4 (slow, 1920x1080) + out/timeline.json (sfx events and
// cursor beats, in real ms since navigation, plus the first-paint offset).
// All API data is mocked via request interception; nothing in src/ changes.

import { spawn, type Subprocess } from "bun";
import { chromium, type Page } from "playwright-core";

const SITE = process.env.SITE ?? "http://localhost:4173";
// "rex" (rex.wf) or "mridul" (mridul.sh): the site picks its identity from the host.
const IDENTITY = process.env.IDENTITY ?? "mridul";
const HOST = IDENTITY === "mridul" ? "mridul.sh" : "rex.wf";
const DISPLAY = ":99";
// 1280x720 @ 1.5 = exactly 1920x1080, with the content reading large.
const VIEW = {
  width: Number(process.env.W ?? 1280),
  height: Number(process.env.H ?? 720),
};
const DPR = Number(process.env.DPR ?? 1.5);
// Small downward nudge so the "lately" card clears the top edge. The card is
// trimmed to two projects for the demo (see CURSOR_CSS) so this can stay small.
const NUDGE = Number(process.env.NUDGE ?? (IDENTITY === "mridul" ? 32 : 8));
const SLOW = Number(process.env.SLOW ?? 4);
// Real capture rate; effective rate is FPS × SLOW.
const FPS = Number(process.env.FPS ?? 30);
const OUT = new URL("./out/", import.meta.url).pathname;
const MOCK = new URL("./mock/", import.meta.url).pathname;
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Wait in *effective* (sped-up) milliseconds.
const wait = (ms: number) => sleep(ms * SLOW);

// ---------------------------------------------------------------------------
// mock data

const stats = {
  online: 3,
  today: 41,
  week: 1204,
  total: 48_213,
  recent: [
    { place: "tokyo", ago: "just now", path: "/" },
    { place: "berlin", ago: "4m", path: "/blog/parabox" },
    { place: "bengaluru", ago: "11m", path: "/" },
  ],
  paths: { "/": 5802, "/blog/parabox": 2214, "/blog": 1037 },
  hi: 12,
  signed: 17,
  guestbook: [
    {
      id: 3,
      name: "maya",
      message: "found you through the parabox writeup. the rose is unfair.",
      place: "berlin",
      ago: "2h",
    },
    {
      id: 2,
      name: "anonymous",
      message: "hi back.",
      place: "austin",
      ago: "1d",
    },
    {
      id: 1,
      name: "k",
      message: "what font is this",
      place: "tokyo",
      ago: "3d",
    },
  ],
};

async function mockRoutes(page: Page) {
  await page.route("**/api/stats", (route) => route.fulfill({ json: stats }));
  await page.route("**/api/beacon", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/spotify/playing", (route) =>
    route.fulfill({ path: `${MOCK}playing.json` })
  );
  // A (silent) preview so the play button shows in the music card.
  await page.route("**/api/spotify/preview/**", (route) =>
    route.fulfill({ json: { url: "/mock-preview.mp3" } })
  );
  await page.route("**/mock-preview.mp3", (route) =>
    route.fulfill({
      path: `${MOCK}preview.mp3`,
      headers: { "access-control-allow-origin": "*" },
    })
  );
  await page.route("**/api/github/contributions", (route) =>
    route.fulfill({ path: `${MOCK}contributions.json` })
  );
  await page.route("https://i.scdn.co/**", (route) => {
    const url = route.request().url();
    const size = url.includes("b273") ? "large" : "medium";
    return route.fulfill({
      path: `${MOCK}cover-${size}.jpg`,
      headers: { "access-control-allow-origin": "*" },
    });
  });
}

// ---------------------------------------------------------------------------
// init scripts

// Slow the page's JS clock by SLOW and throttle rAF to 60 effective fps.
const SLOWMO_JS = `
  (() => {
    const S = ${SLOW};
    const realNow = performance.now.bind(performance);
    window.__realNow = realNow;
    const base = realNow();
    const scaled = () => base + (realNow() - base) / S;
    performance.now = scaled;

    const _setTimeout = window.setTimeout.bind(window);
    const _setInterval = window.setInterval.bind(window);
    window.setTimeout = (fn, ms = 0, ...args) => _setTimeout(fn, ms * S, ...args);
    window.setInterval = (fn, ms = 0, ...args) => _setInterval(fn, ms * S, ...args);

    const _raf = window.requestAnimationFrame.bind(window);
    const STEP = 1000 / 60;
    const queue = new Map();
    let nextId = 0;
    let scheduled = false;
    let last = -Infinity;
    const loop = () => {
      const t = scaled();
      if (t - last >= STEP - 0.25) {
        last = t;
        const callbacks = [...queue.values()];
        queue.clear();
        for (const cb of callbacks) cb(t);
      }
      if (queue.size) _raf(loop); else scheduled = false;
    };
    window.requestAnimationFrame = (cb) => {
      queue.set(++nextId, cb);
      if (!scheduled) { scheduled = true; _raf(loop); }
      return nextId;
    };
    window.cancelAnimationFrame = (id) => { queue.delete(id); };
  })();
`;

// Log the moments the site would play a sound, in real ms since timeOrigin.
const SFX_LOG_JS = `
  (() => {
    window.__sfx = [];
    const now = () => window.__realNow();
    // pointerenter never reaches a window listener; derive it from pointerover
    // the same way React does for onPointerEnter.
    addEventListener('pointerover', (e) => {
      const link = e.target.closest && e.target.closest('a.sentence-link');
      if (link && !link.contains(e.relatedTarget) && e.pointerType !== 'touch') {
        window.__sfx.push({ at: now(), sound: 'pop' });
      }
    }, true);
    addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('button[aria-label="toggle color theme"]');
      if (btn) {
        const dark = document.documentElement.dataset.theme === 'dark';
        window.__sfx.push({ at: now(), sound: dark ? 'lightsOn' : 'lightsOff' });
      }
      // copying the email from the "say hi" card pops once the clipboard write lands
      if (e.target.closest && e.target.closest('.peek-card a[href^="mailto:"]')) {
        window.__sfx.push({ at: now() + 30, sound: 'pop' });
      }
    }, true);
  })();
`;

// In-page cursor, baked into the recording so it's always in sync.
const CURSOR_CSS = `
  *, *::before, *::after { cursor: none !important; }
  /* padding (not transform) so the fixed-position guestbook keeps its containing block */
  main > div:first-child { padding-top: calc(4rem + ${NUDGE * 2}px) !important; }
  /* demo only: two projects in the "lately" card so it fits above the sentence */
  .peek-trigger:has(> a[href="https://github.com/rexdotsh"]) .peek-card > a:nth-of-type(2) { display: none; }
  #rec-cursor {
    position: fixed; left: 0; top: 0; z-index: 2147483647;
    width: 12px; height: 12px; margin: -6px 0 0 -6px;
    border-radius: 999px;
    background: var(--rose);
    box-shadow: 0 0 0 2.5px light-dark(#faf8f2, #131315);
    pointer-events: none;
    opacity: 0;
    /* no transform easing: the rose repels from the real pointer, so the dot must sit exactly on it */
    transition: opacity 400ms ease;
    will-change: transform;
  }
  #rec-cursor[data-down] { transform: translate(var(--x), var(--y)) scale(.7) !important; }
`;

const CURSOR_JS = `
  (() => {
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(CURSOR_CSS)};
    const dot = document.createElement('div');
    dot.id = 'rec-cursor';
    const mount = () => {
      document.head.appendChild(style);
      document.body.appendChild(dot);
    };
    if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
    let shown = false;
    addEventListener('pointermove', (e) => {
      dot.style.setProperty('--x', e.clientX + 'px');
      dot.style.setProperty('--y', e.clientY + 'px');
      dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      if (!shown) { shown = true; dot.style.opacity = '1'; }
    }, true);
    addEventListener('pointerdown', () => dot.toggleAttribute('data-down', true), true);
    addEventListener('pointerup', () => dot.toggleAttribute('data-down', false), true);
    window.__cursor = { hide: () => (dot.style.opacity = '0'), show: () => (dot.style.opacity = '1') };
  })();
`;

// ---------------------------------------------------------------------------
// choreography

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

class Rig {
  readonly page: Page;
  pos = { x: VIEW.width * 0.62, y: VIEW.height * 0.9 };
  t0 = 0;
  beats: Array<{ at: number; event: string; x?: number; y?: number }> = [];

  constructor(page: Page) {
    this.page = page;
  }

  // Real ms since navigation.
  mark(event: string, extra: Record<string, number> = {}) {
    this.beats.push({
      at: Math.round(performance.now() - this.t0),
      event,
      ...extra,
    });
  }

  // Eased glide over `ms` effective milliseconds, with a slight arc.
  async glide(to: { x: number; y: number }, ms: number, arcScale = 1) {
    const from = { ...this.pos };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const arc = Math.min(40, len * 0.08) * arcScale;
    const px = -dy / len;
    const py = dx / len;
    const start = performance.now();
    const total = ms * SLOW;
    this.mark("glide", { x: to.x, y: to.y });
    for (;;) {
      const t = Math.min(1, (performance.now() - start) / total);
      const e = easeInOut(t);
      const bulge = Math.sin(Math.PI * t) * arc;
      this.pos = {
        x: from.x + dx * e + px * bulge,
        y: from.y + dy * e + py * bulge,
      };
      // biome-ignore lint/performance/noAwaitInLoops: real-time animation loop, must be sequential
      await this.page.mouse.move(this.pos.x, this.pos.y);
      if (t >= 1) {
        break;
      }
      await sleep(8);
    }
    this.pos = { ...to };
    await this.page.mouse.move(to.x, to.y);
  }

  async hoverText(text: string, ms: number, dwell: number) {
    const box = await this.page
      .locator(`h1 a:text-is("${text}")`)
      .first()
      .boundingBox();
    if (!box) {
      throw new Error(`no box for ${text}`);
    }
    // aim a bit right-of-centre and low, like a hand would
    await this.glide(
      { x: box.x + box.width * 0.58, y: box.y + box.height * 0.6 },
      ms
    );
    this.mark(`hover:${text}`);
    await wait(dwell);
  }

  async click(name: string, box: { x: number; y: number }, ms: number) {
    await this.glide(box, ms);
    await wait(220);
    this.mark(`click:${name}`, { x: this.pos.x, y: this.pos.y });
    await this.page.mouse.down();
    await wait(90);
    await this.page.mouse.up();
  }

  async clickButton(label: string, ms: number) {
    const box = await this.page
      .getByRole("button", { name: label })
      .boundingBox();
    if (!box) {
      throw new Error(`no box for ${label}`);
    }
    await this.click(
      label,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      ms
    );
  }

  // Glide up into the open "say hi" card and click the email to copy it.
  async copyEmail() {
    const box = await this.page
      .locator('.peek-card a[href^="mailto:"]')
      .boundingBox();
    if (!box) {
      throw new Error("no email link in the hi card");
    }
    // the email is the first line of the link block
    await this.click(
      "copy email",
      { x: box.x + box.width * 0.9, y: box.y + box.height * 0.3 },
      420
    );
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const W = VIEW.width * DPR;
  const H = VIEW.height * DPR;

  const xvfb = spawn(
    [
      "Xvfb",
      DISPLAY,
      "-screen",
      "0",
      `${W}x${H}x24`,
      "-nocursor",
      "-nolisten",
      "tcp",
    ],
    { stdout: "ignore", stderr: "ignore" }
  );
  await sleep(600);

  let ffmpeg: Subprocess | null = null;
  const profile = `/tmp/opencode/rec-profile-${Date.now()}`;
  // Persistent context so the *first* window is ours and honours --kiosk.
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: CHROME,
    headless: false,
    env: { ...process.env, DISPLAY },
    viewport: null,
    colorScheme: "light",
    reducedMotion: "no-preference",
    locale: "en-US",
    permissions: ["clipboard-read", "clipboard-write"],
    extraHTTPHeaders: { "x-forwarded-host": HOST },
    args: [
      `--force-device-scale-factor=${DPR}`,
      `--window-size=${VIEW.width},${VIEW.height}`,
      "--window-position=0,0",
      "--kiosk",
      "--hide-scrollbars",
      "--disable-infobars",
      "--no-first-run",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-renderer-backgrounding",
      "--disable-background-timer-throttling",
    ],
    ignoreDefaultArgs: ["--enable-automation"],
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await mockRoutes(page);
    await page.addInitScript(SLOWMO_JS);
    await page.addInitScript(SFX_LOG_JS);
    await page.addInitScript(CURSOR_JS);

    // CSS animations / transitions / view transitions live on the document
    // timeline, which CDP can slow down to match the JS clock.
    const cdp = await context.newCDPSession(page);
    await cdp.send("Animation.enable");
    await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / SLOW });

    // warm caches (fonts, chunks, cover) so the recorded load is instant
    await page.goto(SITE, { waitUntil: "networkidle" });
    await sleep(1500);
    await page.goto("about:blank");
    await page.setContent('<body style="background:#000;margin:0"></body>');
    await page.mouse.move(VIEW.width * 0.62, VIEW.height * 0.9);
    await sleep(300);

    ffmpeg = spawn(
      [
        "ffmpeg",
        "-y",
        "-loglevel",
        "warning",
        "-stats",
        "-f",
        "x11grab",
        "-framerate",
        String(FPS),
        "-video_size",
        `${W}x${H}`,
        "-draw_mouse",
        "0",
        "-i",
        `${DISPLAY}.0`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "8",
        "-pix_fmt",
        "yuv444p",
        "-g",
        String(FPS),
        `${OUT}raw.mp4`,
      ],
      { stdin: "pipe", stdout: "inherit", stderr: "inherit" }
    );
    await sleep(1200);

    const rig = new Rig(page);
    rig.t0 = performance.now();
    rig.mark("goto");
    await page.goto(SITE);
    rig.mark("loaded");

    // let the sentence stagger in and the rose settle
    await wait(2000);

    await rig.hoverText("build things", 700, 1250);
    await rig.hoverText("write", 480, 1200);
    await rig.hoverText("something", 600, 1450);
    await rig.hoverText("hi back", 520, 650);
    await rig.copyEmail();
    await wait(1500);

    await rig.clickButton("toggle color theme", 760);
    await wait(1300);

    // drift into the rose so it flinches, fade the cursor, hold while it settles
    const rose = await page.locator("canvas").first().boundingBox();
    if (!rose) {
      throw new Error("no rose");
    }
    // One continuous straight glide: through the rose's centre and out the
    // bottom of the frame, so the flinch happens mid-flow.
    const centre = {
      x: rose.x + rose.width * 0.45,
      y: rose.y + rose.height * 0.48,
    };
    const exitY = VIEW.height + 40;
    const k = (exitY - rig.pos.y) / (centre.y - rig.pos.y);
    await rig.glide(
      { x: rig.pos.x + (centre.x - rig.pos.x) * k, y: exitY },
      1700,
      0
    );
    await page.evaluate("window.__cursor.hide()");
    rig.mark("cursor:exit");
    await wait(2200);
    rig.mark("end");

    const firstPaint = (await page.evaluate(
      "performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime ?? 0"
    )) as number;
    const sfx = (await page.evaluate("window.__sfx")) as Array<{
      at: number;
      sound: string;
    }>;
    // Real ms since timeOrigin → real ms since navigation (≈ goto).
    const navStart = (await page.evaluate("performance.timeOrigin")) as number;
    const gotoWall = Date.now() - (performance.now() - rig.t0);
    const originOffset = navStart - gotoWall;

    await Bun.write(
      `${OUT}timeline.json`,
      JSON.stringify(
        {
          slow: SLOW,
          fps: FPS,
          // real ms after navigation at which the first frame painted
          firstPaint: Math.round(firstPaint + originOffset),
          sfx: sfx.map((e) => ({
            sound: e.sound,
            at: Math.round(e.at + originOffset),
          })),
          beats: rig.beats,
        },
        null,
        2
      )
    );
    console.error(`sfx events: ${sfx.length}`);
  } finally {
    if (ffmpeg) {
      ffmpeg.stdin.write("q");
      ffmpeg.stdin.flush();
      await ffmpeg.exited;
    }
    await context.close();
    xvfb.kill();
  }
  console.error(`wrote ${OUT}raw.mp4`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
