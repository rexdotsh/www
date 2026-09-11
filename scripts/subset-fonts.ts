// Regenerates src/fonts from the fontsource packages. Run with `bun run fonts:subset`.
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";

const SUBSETS = {
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext":
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
};
// └ ├ ─ █ ░ for the ascii art and code blocks.
const BOX = "U+2500,U+2514,U+251C,U+2588,U+2591";

interface Family {
  axis?: string;
  family: string;
  italic: boolean;
  slug: string;
  source: (subset: string, style: string) => string;
}

const FAMILIES: Family[] = [
  {
    axis: "400:700",
    family: "Geist Mono Variable",
    italic: false,
    slug: "geist-mono",
    source: (subset, style) =>
      `node_modules/@fontsource-variable/geist-mono/files/geist-mono-${subset}-wght-${style}.woff2`,
  },
  {
    family: "Instrument Serif",
    italic: true,
    slug: "instrument-serif",
    source: (subset, style) =>
      `node_modules/@fontsource/instrument-serif/files/instrument-serif-${subset}-400-${style}.woff2`,
  },
  {
    axis: "400:650",
    family: "Newsreader Variable",
    italic: true,
    slug: "newsreader",
    source: (subset, style) =>
      `node_modules/@fontsource-variable/newsreader/files/newsreader-${subset}-wght-${style}.woff2`,
  },
];

interface Face {
  axis?: string;
  family: string;
  file: string;
  range: string;
  source: string;
  style: string;
  weight: string;
}

const FACES: Face[] = FAMILIES.flatMap((f) =>
  (f.italic ? ["normal", "italic"] : ["normal"]).flatMap((style) =>
    Object.entries(SUBSETS).map(([subset, range]) => ({
      axis: f.axis,
      family: f.family,
      file: `${f.slug}-${subset}${style === "italic" ? "-italic" : ""}.woff2`,
      range,
      source: f.source(subset, style),
      style,
      weight: f.axis?.replace(":", " ") ?? "400",
    }))
  )
);
FACES.push({
  axis: "400:700",
  family: "Geist Mono Variable",
  file: "geist-mono-box.woff2",
  range: BOX,
  source: FAMILIES[0].source("symbols2", "normal"),
  style: "normal",
  weight: "400 700",
});

if (!Bun.which("uv")) {
  console.error("uv is required: https://docs.astral.sh/uv/");
  process.exit(1);
}

const OUT = "src/fonts";
const TMP = ".fonts-tmp";
const UV = ["uv", "run", "--with", "fonttools", "--with", "brotli"];

async function run(command: string[]) {
  const proc = Bun.spawn(command, { stderr: "pipe", stdout: "ignore" });
  if ((await proc.exited) !== 0) {
    throw new Error(await new Response(proc.stderr).text());
  }
}

rmSync(TMP, { force: true, recursive: true });
mkdirSync(TMP);
mkdirSync(OUT, { recursive: true });

let before = 0;
let after = 0;
for (const face of FACES) {
  let input = face.source;
  if (face.axis) {
    input = `${TMP}/${face.file}.ttf`;
    // biome-ignore lint/performance/noAwaitInLoops: sequential on purpose
    await run([
      ...UV,
      "fonttools",
      "varLib.instancer",
      "-o",
      input,
      face.source,
      `wght=${face.axis}`,
    ]);
  }
  const output = `${OUT}/${face.file}`;
  await run([
    ...UV,
    "pyftsubset",
    input,
    `--output-file=${output}`,
    "--flavor=woff2",
    "--layout-features=*",
    `--unicodes=${face.range}`,
  ]);
  const [from, to] = [statSync(face.source).size, statSync(output).size];
  before += from;
  after += to;
  // biome-ignore lint/suspicious/noConsole: build script
  console.log(`${face.file.padEnd(40)} ${from} -> ${to}`);
}
rmSync(TMP, { force: true, recursive: true });

const css = (faces: Face[]) =>
  faces
    .map(
      (face) => `@font-face {
  font-family: "${face.family}";
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url("./fonts/${face.file}") format("woff2");
  unicode-range: ${face.range};
}
`
    )
    .join("\n");

// Local stand-ins with metric overrides (numbers from @capsizecss/metrics
// createFontStack) so the fallback takes the webfont's box and swap doesn't reflow.
const LOCALS = {
  georgia: {
    normal: ["Georgia"],
    italic: ["Georgia Italic", "Georgia-Italic"],
  },
  times: {
    normal: ["Times New Roman", "TimesNewRomanPSMT"],
    italic: ["Times New Roman Italic", "TimesNewRomanPS-ItalicMT"],
  },
  courier: { normal: ["Courier New", "CourierNewPSMT"] },
};
type Fallback = [
  family: string,
  local: keyof typeof LOCALS,
  ascent: string,
  descent: string,
  sizeAdjust: string,
  lineGap?: string,
];
const FALLBACKS: Fallback[] = [
  ["Instrument Serif Fallback", "georgia", "129.426%", "40.5273%", "76.4916%"],
  [
    "Instrument Serif Fallback Times",
    "times",
    "117.9435%",
    "36.9318%",
    "83.9385%",
    "0%",
  ],
  ["Geist Mono Fallback", "courier", "100.5164%", "29.5048%", "99.9837%"],
  ["Newsreader Fallback", "georgia", "76.4676%", "27.5699%", "96.1192%"],
  [
    "Newsreader Fallback Times",
    "times",
    "69.6835%",
    "25.124%",
    "105.4769%",
    "0%",
  ],
];

const fallbackCss = (fallbacks: Fallback[], note: string) =>
  `\n/* ${note} */\n${fallbacks
    .flatMap(([family, local, ascent, descent, size, gap]) => {
      const faces = LOCALS[local];
      return Object.entries(faces).map(
        ([style, names]) => `@font-face {
  font-family: "${family}";${"italic" in faces ? `\n  font-style: ${style};` : ""}
  src: ${names.map((n) => `local("${n}")`).join(", ")};
  ascent-override: ${ascent};
  descent-override: ${descent};${gap ? `\n  line-gap-override: ${gap};` : ""}
  size-adjust: ${size};
}
`
      );
    })
    .join("\n")}`;

const isBody = (face: Face) => face.family === "Newsreader Variable";
const isBodyFallback = ([family]: Fallback) => family.startsWith("Newsreader");
writeFileSync(
  "src/fonts.css",
  css(FACES.filter((face) => !isBody(face))) +
    fallbackCss(
      FALLBACKS.filter((f) => !isBodyFallback(f)),
      "Metric-matched local fallbacks so the swap doesn't reflow (numbers via @capsizecss/metrics)."
    )
);
writeFileSync(
  "src/fonts-body.css",
  css(FACES.filter(isBody)) +
    fallbackCss(
      FALLBACKS.filter(isBodyFallback),
      "Metric-matched local fallbacks; see fonts.css."
    )
);
// biome-ignore lint/suspicious/noConsole: build script
console.log(`\n${before} -> ${after} bytes`);
