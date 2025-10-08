/*
  Build-time script: Image -> ASCII -> WebP raster using Geist Mono glyphs.
  Usage: npm run generate
  
  Converts public/image.png to ASCII art, then renders it using font glyphs and outputs public/rose.webp
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "canvas";
import opentype from "opentype.js";
import sharp from "sharp";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const IMAGE_PATH = path.join(ROOT, "public", "image.png");
const FONT_PATH = path.join(SCRIPT_DIR, "geist-mono.ttf");
const PUBLIC_DIR = path.join(ROOT, "public");
const WEBP_PATH = path.join(PUBLIC_DIR, "rose.webp");

const convertToAscii = async (
  imagePath: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  const chars = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."];
  const img = await loadImage(imagePath);

  const canvas = createCanvas(maxWidth, maxHeight);
  const width = Math.min(img.width, maxWidth);
  const height = Math.min(img.height, maxHeight);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height).data;
  let art = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = [
        imageData[i],
        imageData[i + 1],
        imageData[i + 2],
        imageData[i + 3],
      ];

      if (a === 0) {
        art += " ";
        continue;
      }

      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
      art += chars[charIndex];
    }
    art += "\n";
  }

  return art;
};

const roundCoord = (n: number): string => {
  const v = Math.round(n * 10) / 10;
  return v.toString();
};

const collectUniqueChars = (lines: string[]): Set<string> => {
  const set = new Set<string>();
  for (const ln of lines) {
    for (const ch of ln) {
      if (ch !== " ") {
        set.add(ch);
      }
    }
  }
  return set;
};

type GlyphDefsResult = {
  idForChar: Map<string, string>;
  defsMarkup: string;
};

type Command = {
  type: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

const commandToPathSegment = (c: Command): string => {
  switch (c.type) {
    case "M":
      return `M${c.x ?? 0},${c.y ?? 0}`;
    case "L":
      return `L${c.x ?? 0},${c.y ?? 0}`;
    case "C":
      return `C${c.x1 ?? 0},${c.y1 ?? 0},${c.x2 ?? 0},${c.y2 ?? 0},${c.x ?? 0},${c.y ?? 0}`;
    case "Q":
      return `Q${c.x1 ?? 0},${c.y1 ?? 0},${c.x ?? 0},${c.y ?? 0}`;
    case "Z":
      return "Z";
    default:
      return "";
  }
};

const commandsToPath = (commands: Command[]): string => {
  let d = "";
  for (const c of commands) {
    d += commandToPathSegment(c);
  }
  return d;
};

const buildGlyphDefs = (
  font: opentype.Font,
  ascender: number,
  fontSize: number,
  uniqueChars: Set<string>
): GlyphDefsResult => {
  const idForChar = new Map<string, string>();
  const defsParts: string[] = [];
  for (const ch of uniqueChars) {
    const id = `g${ch.charCodeAt(0)}`;
    idForChar.set(ch, id);
    const glyph = font.charToGlyph(ch);
    const basePath = glyph.getPath(0, ascender, fontSize);
    const base = basePath as {
      toPathData?: (dp?: number) => string;
      commands?: Command[];
    };
    const dStr = base.toPathData
      ? base.toPathData(1)
      : commandsToPath(base.commands ?? []);
    defsParts.push(`<path id="${id}" d="${dStr}" />`);
  }
  return { idForChar, defsMarkup: defsParts.join("") };
};

const processLineChars = (
  line: string,
  idForChar: Map<string, string>,
  yOff: number,
  advanceX: number
): string[] => {
  const parts: string[] = [];
  let col = 0;
  for (const ch of line) {
    if (ch !== " ") {
      const id = idForChar.get(ch);
      if (id) {
        const xOff = col * advanceX;
        parts.push(
          `<use href="#${id}" x="${roundCoord(xOff)}" y="${roundCoord(yOff)}" />`
        );
      }
    }
    col++;
  }
  return parts;
};

const buildUsesForLines = (
  lines: string[],
  idForChar: Map<string, string>,
  lineAdvance: number,
  advanceX: number
): string => {
  const usesParts: string[] = [];
  let row = 0;
  for (const line of lines) {
    const yOff = row * lineAdvance;
    usesParts.push(...processLineChars(line, idForChar, yOff, advanceX));
    row++;
  }
  return usesParts.join("");
};

const ensureDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getMonospaceAdvance = (
  font: opentype.Font,
  unitsPerEm: number,
  scale: number
): number => {
  const g = font.charToGlyph("M");
  return (g.advanceWidth ?? unitsPerEm) * scale;
};

type SvgDimensions = {
  width: number;
  height: number;
  xOffset: number;
};

const generateSvgMarkup = (
  dims: SvgDimensions,
  horizontalScale: number,
  defsMarkup: string,
  usesMarkup: string
): string => {
  const { width, height, xOffset } = dims;
  return `<svg viewBox="0 0 ${roundCoord(width)} ${roundCoord(height)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="roseTitle"><title id="roseTitle">Rose, generated from ASCII</title><defs>${defsMarkup}</defs><g transform="translate(${roundCoord(xOffset)}, ${roundCoord(height)}) scale(${horizontalScale}, -1)" fill="#ff1f56">${usesMarkup}</g></svg>`;
};

const generateWebP = async (asciiArt: string): Promise<void> => {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found at ${FONT_PATH}`);
  }

  const font = await opentype.load(FONT_PATH);

  const fontSize = 10;
  const unitsPerEm = font.unitsPerEm ?? 1000;
  const scale = fontSize / unitsPerEm;

  const lines = asciiArt.replace(/\n+$/g, "").split("\n");
  const maxCols = Math.max(...lines.map((l) => l.length));

  const advanceX = getMonospaceAdvance(font, unitsPerEm, scale);
  const lineHeightRatio = 0.5;
  const lineAdvance = fontSize * lineHeightRatio;

  const ascender = (font.ascender ?? unitsPerEm * 0.8) * scale;
  const descender = (font.descender ?? -unitsPerEm * 0.2) * scale;

  const uniqueChars = collectUniqueChars(lines);
  const { idForChar, defsMarkup } = buildGlyphDefs(
    font,
    ascender,
    fontSize,
    uniqueChars
  );
  const usesMarkup = buildUsesForLines(lines, idForChar, lineAdvance, advanceX);

  const width = Math.ceil(maxCols * advanceX);
  const height = Math.ceil(
    ascender - descender + (lines.length - 1) * lineAdvance
  );
  const horizontalScale = 0.9;
  const xOffset = (width * (1 - horizontalScale)) / 2;

  const dims = { width, height, xOffset };
  const svgMarkup = generateSvgMarkup(
    dims,
    horizontalScale,
    defsMarkup,
    usesMarkup
  );
  ensureDir(PUBLIC_DIR);

  const targetWidth = 370;
  const svgBuffer = Buffer.from(svgMarkup);
  await sharp(svgBuffer)
    .resize({ width: targetWidth })
    .flip()
    .trim()
    .webp({ quality: 82, effort: 4 })
    .toFile(WEBP_PATH);
};

const main = async (): Promise<void> => {
  const asciiArt = await convertToAscii(IMAGE_PATH, 500, 1000);
  await generateWebP(asciiArt);
  console.log(`Successfully generated ${WEBP_PATH}`);
};

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
