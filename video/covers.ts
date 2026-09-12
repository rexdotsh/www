// Compare how different album covers look once the rose "dresses up" as them.
// Headless; no Xvfb or full capture needed.
//
//   bun covers.ts          → out/covers/sheet.png (+ one png per cover)
//
// Art is fetched from the iTunes Search API (no auth), then served to the page
// through the same route mocks the capture uses.

import { chromium, type Page } from "playwright-core";

const SITE = process.env.SITE ?? "http://localhost:4173";
const OUT = new URL("./out/covers/", import.meta.url).pathname;
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

const CANDIDATES: Array<{ artist: string; album: string; track: string }> = [
  { artist: "Radiohead", album: "In Rainbows", track: "Weird Fishes/Arpeggi" },
  { artist: "Jamie xx", album: "In Colour", track: "Loud Places" },
  { artist: "Joy Division", album: "Unknown Pleasures", track: "Disorder" },
  { artist: "Kanye West", album: "808s & Heartbreak", track: "Street Lights" },
  {
    artist: "Tame Impala",
    album: "Currents",
    track: "The Less I Know the Better",
  },
  { artist: "Kendrick Lamar", album: "DAMN.", track: "LOVE." },
  { artist: "Bon Iver", album: "22, A Million", track: "22 (OVER S∞∞N)" },
  { artist: "Tyler, The Creator", album: "IGOR", track: "EARFQUAKE" },
  { artist: "Frank Ocean", album: "channel ORANGE", track: "Pink Matter" },
  { artist: "Men I Trust", album: "Oncle Jazz", track: "Show Me How" },
  { artist: "Steve Lacy", album: "Gemini Rights", track: "Bad Habit" },
  { artist: "Tyler, The Creator", album: "Flower Boy", track: "See You Again" },
  { artist: "Fishmans", album: "Long Season", track: "Long Season" },
  {
    artist: "Toro y Moi",
    album: "Anything in Return",
    track: "So Many Details",
  },
];

interface Cover {
  album: string;
  artist: string;
  bytes: Uint8Array;
  slug: string;
  track: string;
}

async function fetchCover(
  c: (typeof CANDIDATES)[number]
): Promise<Cover | null> {
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const queries = [`${c.artist} ${c.album}`, c.album, `${c.album} ${c.artist}`];
  for (const query of queries) {
    // biome-ignore lint/performance/noAwaitInLoops: fallback chain, stop at first hit
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=8`
    );
    const { results } = (await res.json()) as {
      results: Array<{
        artworkUrl100: string;
        collectionName: string;
        artistName: string;
      }>;
    };
    const hit =
      results.find(
        (r) =>
          norm(r.collectionName).includes(norm(c.album)) &&
          norm(r.artistName).includes(norm(c.artist).slice(0, 6))
      ) ?? results.find((r) => norm(r.collectionName).includes(norm(c.album)));
    if (hit) {
      const url = hit.artworkUrl100.replace("100x100bb", "640x640bb");
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      const slug = c.album.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return { ...c, slug, bytes };
    }
  }
  console.error(`(skipping ${c.album}: no itunes match)`);
  return null;
}

async function dressUp(page: Page, cover: Cover) {
  const image = `https://i.scdn.co/image/${cover.slug}`;
  await page.unrouteAll();
  await page.route("**/api/spotify/playing", (route) =>
    route.fulfill({
      json: {
        isPlaying: true,
        name: cover.track,
        artist: cover.artist,
        album: cover.album,
        image: [
          { "#text": image, size: "large" },
          { "#text": image, size: "medium" },
          { "#text": image, size: "small" },
        ],
        url: "https://open.spotify.com/",
        id: cover.slug,
      },
    })
  );
  await page.route("**/api/spotify/preview/**", (route) =>
    route.fulfill({ status: 404 })
  );
  await page.route("**/api/beacon", (route) => route.fulfill({ status: 204 }));
  await page.route(image, (route) =>
    route.fulfill({
      body: Buffer.from(cover.bytes),
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
    })
  );

  await page.goto(SITE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.hover('h1 a:text-is("something")');
  // let the particles travel to their art positions
  await page.waitForTimeout(2800);
  const shot = await page.locator("canvas").first().screenshot({
    omitBackground: true,
  });
  await Bun.write(`${OUT}${cover.slug}.png`, shot);
  return shot;
}

const sheet = (
  items: Array<{ cover: Cover; png: string; art: string }>
) => `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; padding: 48px; background: #faf8f2; color: #17140f; font: 12px/1.4 ui-monospace, "Geist Mono", monospace; width: 1700px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px 28px; }
  .tile { text-align: center; }
  .rose { width: 100%; aspect-ratio: 1; object-fit: contain; display: block; }
  .meta { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 8px; }
  .meta img { width: 36px; height: 36px; border-radius: 4px; }
  .meta span { text-align: left; color: #847c6c; }
  .meta b { display: block; color: #17140f; font-weight: 500; }
  .n { color: #b3123a; margin-right: 6px; }
</style></head><body><div class="grid">
${items
  .map(
    ({ cover, png, art }, i) => `<div class="tile">
  <img class="rose" src="${png}">
  <div class="meta"><img src="${art}"><span><b><i class="n">${i + 1}</i>${cover.album}</b>${cover.artist}</span></div>
</div>`
  )
  .join("\n")}
</div></body></html>`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
try {
  const items: Array<{ cover: Cover; png: string; art: string }> = [];
  for (const candidate of CANDIDATES) {
    // biome-ignore lint/performance/noAwaitInLoops: one shared page, sequential by design
    const cover = await fetchCover(candidate);
    if (!cover) {
      continue;
    }
    const shot = await dressUp(page, cover);
    items.push({
      cover,
      png: `data:image/png;base64,${Buffer.from(shot).toString("base64")}`,
      art: `data:image/jpeg;base64,${Buffer.from(cover.bytes).toString("base64")}`,
    });
    console.error(`${cover.album} ✓`);
  }
  const review = await browser.newPage({
    viewport: { width: 1800, height: 1000 },
    deviceScaleFactor: 1,
  });
  await review.setContent(sheet(items));
  await review.screenshot({ path: `${OUT}sheet.png`, fullPage: true });
  console.error(`wrote ${OUT}sheet.png`);
} finally {
  await browser.close();
}
