/*
  Build-time script: Image -> ASCII -> SVG -> raster (AVIF) using Geist Mono glyphs.
  Usage: npm run generate
  
  Converts public/image.png to ASCII art, renders it as SVG glyphs, then outputs
  public/rose.avif.
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
const AVIF_PATH = path.join(PUBLIC_DIR, "rose.avif");
const TARGET_WIDTH = 400;

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
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = [
        imageData[i],
        imageData[i + 1],
        imageData[i + 2],
        imageData[i + 3],
      ];

      if (a === 0) {
        row.push(" ");
        continue;
      }

      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
      row.push(chars[charIndex]);
    }
    lines.push(row.join(""));
  }

  return lines.join("\n");
};

const roundCoord = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

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
    const pathData = glyph.getPath(0, ascender, fontSize).toPathData(1);
    defsParts.push(`<path id="${id}" d="${pathData}" />`);
  }
  return { idForChar, defsMarkup: defsParts.join("") };
};

const buildUsesForLines = (
  lines: string[],
  idForChar: Map<string, string>,
  lineAdvance: number,
  advanceX: number
): string => {
  const usesParts: string[] = [];

  for (let row = 0; row < lines.length; row++) {
    const yOff = row * lineAdvance;
    const line = lines[row];

    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch !== " ") {
        const id = idForChar.get(ch);
        if (id) {
          const xOff = col * advanceX;
          usesParts.push(
            `<use href="#${id}" x="${roundCoord(xOff)}" y="${roundCoord(yOff)}" />`
          );
        }
      }
    }
  }

  return usesParts.join("");
};

const getMonospaceAdvance = (
  font: opentype.Font,
  unitsPerEm: number,
  scale: number
): number => {
  const g = font.charToGlyph("M");
  return (g.advanceWidth ?? unitsPerEm) * scale;
};

type SvgConfig = {
  width: number;
  height: number;
  xOffset: number;
  horizontalScale: number;
  defsMarkup: string;
  usesMarkup: string;
};

const generateSvgMarkup = ({
  width,
  height,
  xOffset,
  horizontalScale,
  defsMarkup,
  usesMarkup,
}: SvgConfig): string =>
  `<svg viewBox="0 0 ${roundCoord(width)} ${roundCoord(height)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="roseTitle"><title id="roseTitle">Rose, generated from ASCII</title><defs>${defsMarkup}</defs><g transform="translate(${roundCoord(xOffset)}, ${roundCoord(height)}) scale(${horizontalScale}, -1)" fill="#ff1f56">${usesMarkup}</g></svg>`;

const buildSvgBuffer = async (asciiArt: string): Promise<Buffer> => {
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

  const svgMarkup = generateSvgMarkup({
    width,
    height,
    xOffset,
    horizontalScale,
    defsMarkup,
    usesMarkup,
  });
  return Buffer.from(svgMarkup);
};

const rasterizeAVIF = async (svgBuffer: Buffer): Promise<void> => {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  await sharp(svgBuffer)
    .flip()
    .trim()
    .resize({
      width: TARGET_WIDTH,
      height: TARGET_WIDTH,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .avif({ quality: 100 })
    .toFile(AVIF_PATH);
};

const main = async (): Promise<void> => {
  const asciiArt = await convertToAscii(IMAGE_PATH, 500, 1000);
  const svgBuffer = await buildSvgBuffer(asciiArt);
  await rasterizeAVIF(svgBuffer);
  console.log(`Successfully generated ${AVIF_PATH}`);
};

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
