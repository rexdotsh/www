// Turns out/raw.mp4 (slow-motion capture) into out/site.mp4: trims the black
// lead-in, speeds back up to real time at 60fps, mixes in the sfx at the
// moments the site fired them, and encodes for X/Twitter.
//
//   bun finish.ts            (after `bun capture.ts` and `bun sfx-render.ts`)
//   TRIM_END=0.8 SFX_GAIN=1.5 bun finish.ts

import { $ } from "bun";
import { FRAME, INNER_X, INNER_Y } from "./frame";

const OUT = new URL("./out/", import.meta.url).pathname;
const RAW = `${OUT}raw.mp4`;
const FINAL = `${OUT}site.mp4`;
const TRIM_END = Number(process.env.TRIM_END ?? 0.8); // effective seconds
const SFX_GAIN = Number(process.env.SFX_GAIN ?? 1.5);
// FRAME=0 for the bare 1920x1080 capture; default sits it in the gradient frame.
const FRAMED = process.env.FRAME !== "0";
const OUT_FPS = 60;

interface Timeline {
  firstPaint: number;
  sfx: Array<{ sound: string; at: number }>;
  slow: number;
}

const timeline = (await Bun.file(`${OUT}timeline.json`).json()) as Timeline;
const S = timeline.slow;

// The capture starts on a black page; the first non-black frame is the site painting.
const detect =
  await $`ffmpeg -hide_banner -i ${RAW} -vf blackdetect=d=0.05:pix_th=0.10 -an -f null -`
    .quiet()
    .nothrow();
const blackEnd = Number(
  /black_end:([\d.]+)/.exec(detect.stderr.toString())?.[1] ?? 0
);
const rawDuration = Number(
  (
    await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${RAW}`.text()
  ).trim()
);
const rawEnd = rawDuration - TRIM_END * S;
const outDuration = (rawEnd - blackEnd) / S;

// Audio: one input per event, delayed to its effective time, then mixed.
const frameInputs = FRAMED
  ? [
      // a looped still defaults to 25fps and would drag the overlay down with it
      "-loop",
      "1",
      "-framerate",
      String(OUT_FPS),
      "-i",
      `${OUT}frame-bg.png`,
      "-i",
      `${OUT}frame-mask.png`,
    ]
  : [];
// Frame inputs come right after the video so the sfx indices below stay stable.
const FRAME_INPUTS = frameInputs.length > 0 ? 2 : 0;

// Grazing a link edge fires pointerenter twice in quick succession; keep one.
const DEDUPE_MS = 150;
let popIndex = 0;
let lastAt = Number.NEGATIVE_INFINITY;
const inputs: string[] = [];
const chains: string[] = [];
timeline.sfx.forEach((event, i) => {
  const atMs = (event.at - timeline.firstPaint) / S;
  if (atMs < 0 || atMs / 1000 > outDuration || atMs - lastAt < DEDUPE_MS) {
    return;
  }
  lastAt = atMs;
  const file =
    event.sound === "pop" ? `pop-${popIndex % 6}.wav` : `${event.sound}.wav`;
  if (event.sound === "pop") {
    popIndex += 1;
  }
  inputs.push("-i", `${OUT}sfx/${file}`);
  const n = FRAME_INPUTS + inputs.length / 2; // input index (0 is the video)
  chains.push(`[${n}:a]adelay=${Math.round(atMs)}[a${i}]`);
});

const site = `[0:v]trim=start=${blackEnd}:end=${rawEnd},setpts=(PTS-STARTPTS)/${S},fps=${OUT_FPS}`;
const video = FRAMED
  ? `${site},scale=${FRAME.inner.width}:${FRAME.inner.height}:flags=lanczos[site];` +
    `[2:v]crop=${FRAME.inner.width}:${FRAME.inner.height}:${INNER_X}:${INNER_Y},format=gray[mask];` +
    "[site][mask]alphamerge[card];" +
    `[1:v][card]overlay=${INNER_X}:${INNER_Y}:format=auto,fps=${OUT_FPS},format=yuv420p[v]`
  : `${site},format=yuv420p[v]`;
const audio =
  chains.length > 0
    ? `${chains.join(";")};${chains
        .map((c) => /\[(a\d+)\]$/.exec(c)?.[1])
        .map((l) => `[${l}]`)
        .join(
          ""
        )}amix=inputs=${chains.length}:normalize=0,volume=${SFX_GAIN},aformat=channel_layouts=stereo,apad[a]`
    : "anullsrc=r=48000:cl=stereo[a]";

await $`ffmpeg -hide_banner -loglevel error -stats -y -i ${RAW} ${frameInputs} ${inputs} -filter_complex ${`${video};${audio}`} -map [v] -map [a] -t ${outDuration} -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -c:a aac -b:a 160k -movflags +faststart ${FINAL}`;

console.error(
  `\nblack lead-in ${blackEnd.toFixed(2)}s · ${chains.length} sfx · ${outDuration.toFixed(2)}s`
);
console.error(
  (
    await $`ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate -show_entries format=duration -of default=nw=1 ${FINAL}`.text()
  ).trim()
);
