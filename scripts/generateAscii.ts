// this is in it's own folder and package because bun doesn't support canvas
// and it's an unnecessary dependency anyway since it's only used in the build process
// so just using it with node for now, `npm run generate` to generate the ascii art
// ascii art is generated from the public/image.png file in the root of the project
// output is in src/components/Art/ascii-art.ts

import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";

const convertToAscii = async (imagePath: string, maxWidth: number, maxHeight: number) => {
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
      const [r, g, b, a] = [imageData[i], imageData[i + 1], imageData[i + 2], imageData[i + 3]];

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

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const imagePath = path.join(rootDir, "public", "image.png");
  const outputPath = path.join(rootDir, "app", "components", "AsciiArt", "ascii-art.ts");

  const asciiArt = await convertToAscii(imagePath, 500, 1000);

  const outputContent = `// this file is generated by scripts/generateAscii.ts - do not edit
export const asciiArt = \`${asciiArt}\`;
`;

  await fs.writeFile(outputPath, outputContent);
  console.log("ASCII art constant generated successfully!");
}

main().catch(console.error);
