export const convertToAscii = (img: HTMLImageElement, maxWidth: number, maxHeight: number, chars: string[] = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."]) => {
  const canvas = document.createElement("canvas");
  const width = Math.min(img.width, maxWidth);
  const height = Math.min(img.height, maxHeight);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
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
