import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import monoWoff from "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff" with { type: "file" };
import serifItalicWoff from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff" with { type: "file" };
import serifWoff from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff" with { type: "file" };
import optimise from "@jsquash/oxipng/optimise";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { ASCII_ROSE } from "../src/lib/ascii-rose";
import { HOSTS } from "../src/lib/fleet";
import { PUBLISHED_META } from "../src/lib/posts-meta";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(SCRIPT_DIR, "..", "public");
const OUT_DIR = path.join(PUBLIC_DIR, "og");

const WIDTH = 1200;
const HEIGHT = 630;

const SITES = [
  { domain: "rex.wf", file: "social-card-rex.png", name: "rex" },
  { domain: "mridul.sh", file: "social-card-mridul.png", name: "mridul" },
];

const PAPER = "#faf8f2";
const INK = "#17140f";
const ROSE = "#b3123a";
const MUTED = "#847c6c";
const FAINT = "#a29a89";

type Style = Record<string, string | number>;

interface Node {
  props: {
    style?: Style;
    children?: Node | Node[] | string;
  };
  type: string;
}

const el = (
  type: string,
  style: Style,
  children?: Node | Node[] | string
): Node => ({
  type,
  props: { style, children },
});

const page = (style: Style, children: Node[]): Node =>
  el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      background: PAPER,
      ...style,
    },
    children
  );

const rose = (fontSize: number, style: Style): Node =>
  el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      color: ROSE,
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
  style: Style = {}
): Node =>
  el("div", { fontFamily: "Geist Mono", fontSize, color, ...style }, text);

const label = (text: string): Node =>
  mono(text, FAINT, 20, { letterSpacing: 7, textTransform: "uppercase" });

const headline = (text: string, fontSize: number, style: Style = {}): Node =>
  el(
    "div",
    {
      display: "flex",
      fontFamily: "Instrument Serif",
      fontSize,
      lineHeight: 1,
      color: INK,
      ...style,
    },
    [el("span", {}, text), el("span", { color: ROSE }, ".")]
  );

const siteCard = (name: string, domain: string): Node =>
  page({ position: "relative", overflow: "hidden" }, [
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
        mono(domain, FAINT, 20, { letterSpacing: 6 }),
        el("div", { display: "flex", flexDirection: "column" }, [
          headline(`hi, i'm ${name}`, 96),
          el(
            "div",
            {
              display: "flex",
              fontFamily: "Instrument Serif Italic",
              fontSize: 44,
              color: ROSE,
              marginTop: 18,
            },
            "say hi back."
          ),
        ]),
        mono("( alive, technically )", FAINT, 18, { fontStyle: "italic" }),
      ]
    ),
  ]);

const card = (title: string, metaLine: string, kicker = "writing"): Node =>
  page({ flexDirection: "row", alignItems: "center", padding: "64px 72px" }, [
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
        label(kicker),
        headline(title, 74, { lineHeight: 1.08, maxWidth: 660 }),
        mono(metaLine, MUTED, 20),
      ]
    ),
    rose(13, { color: "#ce2955" }),
  ]);

const workshopCard = (): Node =>
  page(
    {
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 84px",
    },
    [
      label("status"),
      el("div", { display: "flex", flexDirection: "column" }, [
        headline("the workshop", 104),
        mono("four machines and what they run.", MUTED, 24, { marginTop: 18 }),
      ]),
      el(
        "div",
        { display: "flex", flexDirection: "column", gap: 14 },
        Object.keys(HOSTS).map((host) =>
          el("div", { display: "flex", alignItems: "center", gap: 18 }, [
            el("div", {
              width: 10,
              height: 10,
              borderRadius: 5,
              background: ROSE,
            }),
            mono(host, INK, 20, { width: 80 }),
            el(
              "div",
              { display: "flex", flexGrow: 1, gap: 3, height: 16 },
              Array.from({ length: 60 }, () =>
                el("div", {
                  flexGrow: 1,
                  borderRadius: 1,
                  background: "rgba(179, 18, 58, 0.22)",
                })
              )
            ),
          ])
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
  const optimised = await optimise(new Uint8Array(png.asPng()).buffer, {
    optimiseAlpha: false,
  });
  fs.writeFileSync(file, new Uint8Array(optimised));
};

fs.mkdirSync(OUT_DIR, { recursive: true });

await Promise.all([
  ...SITES.map((site) =>
    render(siteCard(site.name, site.domain), path.join(PUBLIC_DIR, site.file))
  ),
  render(workshopCard(), path.join(OUT_DIR, "workshop.png")),
  render(
    card("writing", "( infrequent. long. )", "blog"),
    path.join(OUT_DIR, "blog.png")
  ),
  ...PUBLISHED_META.map((post) =>
    render(
      card(post.title, post.dateLabel),
      path.join(OUT_DIR, `${post.slug}.png`)
    )
  ),
]);
