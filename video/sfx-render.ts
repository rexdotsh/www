// Renders the site's Web Audio sound effects to WAV files using the real
// src/lib/sfx.ts module inside headless Chromium with an OfflineAudioContext.
//
//   bun sfx-render.ts        → out/sfx/pop-0.wav … lightsOff.wav …

import { chromium } from "playwright-core";

const OUT = new URL("./out/sfx/", import.meta.url).pathname;
const SFX_SRC = new URL("../src/lib/sfx.ts", import.meta.url).pathname;
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const RATE = 48_000;
const SECONDS = 1.2;
// `pop` is randomly detuned per play; render a few so hovers don't sound identical.
const RENDERS: Array<{ name: string; sound: string }> = [
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ name: `pop-${i}`, sound: "pop" })),
  { name: "lightsOff", sound: "lightsOff" },
  { name: "lightsOn", sound: "lightsOn" },
];

const transpiler = new Bun.Transpiler({ loader: "ts", target: "browser" });
// Inline module scripts can't have export declarations; keep the bindings local.
const moduleJs = transpiler
  .transformSync(await Bun.file(SFX_SRC).text())
  .replace(/^export\s+/gm, "");

const harness = (sound: string) => `<!doctype html><body><script type="module">
  const offline = new OfflineAudioContext(1, ${Math.ceil(RATE * SECONDS)}, ${RATE});
  // sfx.ts only plays when the context reports "running"; offline contexts sit
  // "suspended" until startRendering, so pretend.
  Object.defineProperty(offline, "state", { value: "running" });
  offline.resume = () => Promise.resolve();
  window.AudioContext = function AudioContext() { return offline; };

  ${moduleJs}

  sfx(${JSON.stringify(sound)});
  // setMuted(false) runs the unlock path, creating our fake context and
  // flushing the pending sound into it.
  setMuted(false);
  window.__render = offline.startRendering().then((buf) => Array.from(buf.getChannelData(0)));
</script></body>`;

function wav(samples: number[]) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 32_767;
  }
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) {
      v.setUint8(o + i, s.charCodeAt(i));
    }
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.byteLength, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.byteLength, true);
  return new Blob([header, pcm.buffer]);
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
try {
  for (const { name, sound } of RENDERS) {
    // biome-ignore lint/performance/noAwaitInLoops: one shared page, renders must be sequential
    await page.setContent(harness(sound));
    const samples = (await page.evaluate("window.__render")) as number[];
    const peak = Math.max(...samples.map(Math.abs));
    if (peak < 0.001) {
      throw new Error(`${name} rendered silence`);
    }
    await Bun.write(`${OUT}${name}.wav`, wav(samples));
    console.error(`${name}: peak ${peak.toFixed(2)}`);
  }
} finally {
  await browser.close();
}
