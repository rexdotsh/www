/*
  Generates per-post OG cards into public/og/<slug>.png.
  Usage: bun run og:gen (rerun when adding posts)
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { ASCII_ROSE } from "../src/lib/ascii-rose";
import { POSTS_META } from "../src/lib/posts-meta";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const OUT_DIR = path.join(ROOT, "public", "og");
const FONTS = path.join(ROOT, "node_modules");

const WIDTH = 1200;
const HEIGHT = 630;

interface Node {
  props: {
    style?: Record<string, string | number>;
    children?: Node | Node[] | string;
  };
  type: string;
}

const el = (
  type: string,
  style: Record<string, string | number>,
  children?: Node | Node[] | string
): Node => ({ type, props: { style, children } });

const card = (title: string, metaLine: string): Node =>
  el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      background: "#faf8f2",
      padding: "64px 72px",
    },
    [
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          flexGrow: 1,
          paddingRight: 40,
        },
        [
          el(
            "div",
            {
              fontFamily: "Geist Mono",
              fontSize: 20,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: "#a29a89",
            },
            "writing"
          ),
          el(
            "div",
            {
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 74,
              lineHeight: 1.08,
              color: "#17140f",
              maxWidth: 660,
            },
            [el("span", {}, title), el("span", { color: "#b3123a" }, ".")]
          ),
          el(
            "div",
            {
              fontFamily: "Geist Mono",
              fontSize: 20,
              color: "#847c6c",
            },
            metaLine
          ),
        ]
      ),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          color: "#ce2955",
          fontFamily: "Geist Mono",
          fontSize: 13,
          lineHeight: 1.05,
        },
        ASCII_ROSE.split("\n").map((line) =>
          el("div", { whiteSpace: "pre" }, line.length > 0 ? line : " ")
        )
      ),
    ]
  );

const serif = fs.readFileSync(
  path.join(
    FONTS,
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"
  )
);
const mono = fs.readFileSync(
  path.join(
    FONTS,
    "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff"
  )
);

fs.mkdirSync(OUT_DIR, { recursive: true });

await Promise.all(
  POSTS_META.filter((entry) => !entry.draft).map(async (post) => {
    const svg = await satori(
      card(post.title, post.dateLabel) as unknown as Parameters<
        typeof satori
      >[0],
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          {
            name: "Instrument Serif",
            data: serif,
            style: "normal",
            weight: 400,
          },
          { name: "Geist Mono", data: mono, style: "normal", weight: 400 },
        ],
      }
    );
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: WIDTH * 2 },
    }).render();
    fs.writeFileSync(path.join(OUT_DIR, `${post.slug}.png`), png.asPng());
  })
);
