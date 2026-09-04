/*
  Generates the site cards (public/social-card*.png) and per-post OG cards
  (public/og/<slug>.png). Usage: bun run og:gen (rerun when adding posts)
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import monoWoff from "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff" with {
  type: "file",
};
import serifItalicWoff from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff" with {
  type: "file",
};
import serifWoff from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff" with {
  type: "file",
};
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { ASCII_ROSE } from "../src/lib/ascii-rose";
import { POSTS_META } from "../src/lib/posts-meta";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(SCRIPT_DIR, "..", "public");
const OUT_DIR = path.join(PUBLIC_DIR, "og");

const WIDTH = 1200;
const HEIGHT = 630;

const SITES = [
  { domain: "rex.wf", file: "social-card.png", name: "rex" },
  { domain: "mridul.sh", file: "social-card-mridul.png", name: "mridul" },
];

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

const rose = (fontSize: number, style: Record<string, string | number>): Node =>
  el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      color: "#b3123a",
      fontFamily: "Geist Mono",
      fontSize,
      lineHeight: 1.05,
      ...style,
    },
    ASCII_ROSE.split("\n").map((line) =>
      el("div", { whiteSpace: "pre" }, line.length > 0 ? line : " ")
    )
  );

const mono = (
  text: string,
  color: string,
  fontSize: number,
  style: Record<string, string | number> = {}
): Node =>
  el("div", { fontFamily: "Geist Mono", fontSize, color, ...style }, text);

const siteCard = (name: string, domain: string): Node =>
  el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      background: "#faf8f2",
      position: "relative",
      overflow: "hidden",
    },
    [
      rose(30, { position: "absolute", right: -170, bottom: -140 }),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          padding: "72px 84px",
        },
        [
          mono(domain, "#a29a89", 20, { letterSpacing: 6 }),
          el("div", { display: "flex", flexDirection: "column" }, [
            el(
              "div",
              {
                display: "flex",
                fontFamily: "Instrument Serif",
                fontSize: 96,
                lineHeight: 1,
                color: "#17140f",
              },
              [
                el("span", {}, `hi, i'm ${name}`),
                el("span", { color: "#b3123a" }, "."),
              ]
            ),
            el(
              "div",
              {
                display: "flex",
                fontFamily: "Instrument Serif Italic",
                fontSize: 44,
                color: "#b3123a",
                marginTop: 18,
              },
              "say hi back."
            ),
          ]),
          mono("( alive, technically )", "#a29a89", 18, {
            fontStyle: "italic",
          }),
        ]
      ),
    ]
  );

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

const fonts = [
  {
    name: "Instrument Serif",
    data: fs.readFileSync(serifWoff),
    style: "normal" as const,
    weight: 400 as const,
  },
  {
    name: "Instrument Serif Italic",
    data: fs.readFileSync(serifItalicWoff),
    style: "normal" as const,
    weight: 400 as const,
  },
  {
    name: "Geist Mono",
    data: fs.readFileSync(monoWoff),
    style: "normal" as const,
    weight: 400 as const,
  },
];

const render = async (node: Node, file: string) => {
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  }).render();
  fs.writeFileSync(file, png.asPng());
};

fs.mkdirSync(OUT_DIR, { recursive: true });

await Promise.all([
  ...SITES.map((site) =>
    render(siteCard(site.name, site.domain), path.join(PUBLIC_DIR, site.file))
  ),
  ...POSTS_META.filter((entry) => !entry.draft).map((post) =>
    render(
      card(post.title, post.dateLabel),
      path.join(OUT_DIR, `${post.slug}.png`)
    )
  ),
]);
