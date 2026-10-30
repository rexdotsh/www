# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools[woff]==4.68.0"]
# ///
"""Cut the webfonts down to what the site renders: `bun run fonts:subset` (needs uv).

Every face is split in two. The core (ASCII plus the punctuation most pages
use) is preloaded; the rest of Latin-1 and Latin Extended-A sits in an ext
file that only downloads when a page draws one of its characters. Anything
else (CJK, arrows, Vietnamese) falls through to system fonts.

Rerun after a page starts drawing one of these fonts with a character outside
these sets (an arrow, a symbol, more box drawing), a weight outside the axis
ranges, or an OpenType feature not listed (font-variant-*, font-feature-settings),
then commit src/fonts and the two stylesheets. Fallback faces in the
stylesheets are hand-written and left alone.

Hinting stays: dropping it saves ~4.8 kB per Instrument Serif file but moves
glyphs and changes line widths on Windows and Linux.
"""

import re
import subprocess
import urllib.request
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SOURCE = "https://raw.githubusercontent.com/google/fonts/6157dfaa640ca5738b4d1a7070fe389c3036d7fc/ofl"
GEIST = "https://raw.githubusercontent.com/vercel/geist-font/72f67167dd304a842ef8899da57fa25c5cf21756/fonts"
OUT = Path("src/fonts")

ASCII = set(range(0x20, 0x7F))
# nbsp, middle dot, en/em dash, curly quotes, ellipsis (also text-overflow).
PUNCTUATION = {0xA0, 0xB7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026}
LATIN = set(range(0xA0, 0x180))
# ─ └ ├ █ ░: the parabox tree, the workshop gauges and the now-playing bar.
BOX = {0x2500, 0x2514, 0x251C, 0x2588, 0x2591}

FACES = [
    # css, family, style, file, source, axis limits (applied in order), features, core extras, ext extras
    ("fonts.css", "Geist Mono Variable", "normal", "geist-mono", "geistmono/GeistMono[wght].ttf", [{"wght": (400, 700)}], [], BOX, set()),
    ("fonts.css", "Geist Serif", "normal", "geist-serif", f"{GEIST}/GeistSerif/ttf/GeistSerif-Regular.ttf", [], ["kern", "ccmp", "mark", "mkmk"], set(), set()),
    # Geist Serif has no italic yet; its italics are Instrument Serif's.
    ("fonts.css", "Geist Serif", "italic", "instrument-serif-italic", "instrumentserif/InstrumentSerif-Italic.ttf", [], ["kern", "liga"], set(), set()),
    # Pinning opsz before limiting wght matches the old Fontsource-based outlines.
    ("fonts-body.css", "Newsreader Variable", "normal", "newsreader", "newsreader/Newsreader[opsz,wght].ttf", [{"opsz": 16}, {"wght": (400, 650)}], ["kern", "liga", "rvrn"], set(), set()),
    ("fonts-body.css", "Newsreader Variable", "italic", "newsreader-italic", "newsreader/Newsreader-Italic[opsz,wght].ttf", [{"opsz": 16}, {"wght": (400, 650)}], ["kern", "liga", "rvrn"], set(), set()),
]


def fetch(path: str) -> TTFont:
    url = path if path.startswith("https://") else f"{SOURCE}/{path}"
    with urllib.request.urlopen(url.replace("[", "%5B").replace("]", "%5D")) as res:
        return TTFont(BytesIO(res.read()))


def cut(font: TTFont, unicodes: set[int], features: list[str], file: Path) -> list[int]:
    options = subset.Options()
    options.layout_features = features
    options.drop_tables += ["STAT", "meta", "DSIG"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    font = TTFont(BytesIO(serialize(font)), recalcTimestamp=False)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(file)
    return sorted(font.getBestCmap())


def serialize(font: TTFont) -> bytes:
    font.recalcTimestamp = False
    buf = BytesIO()
    font.save(buf)
    return buf.getvalue()


def ranges(cps: list[int]) -> str:
    runs: list[list[int]] = []
    for cp in cps:
        if runs and cp == runs[-1][1] + 1:
            runs[-1][1] = cp
        else:
            runs.append([cp, cp])
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


OUT.mkdir(exist_ok=True)
for stale in OUT.glob("*.woff2"):
    stale.unlink()

css: dict[str, list[str]] = {}
for sheet, family, style, slug, source, limits, features, core_extra, ext_extra in FACES:
    font = fetch(source)
    for limit in limits:
        font = instancer.instantiateVariableFont(font, limit)
    weight = " ".join(str(w) for w in limits[-1]["wght"]) if limits else "400"
    available = set(font.getBestCmap())
    core = (ASCII | PUNCTUATION | core_extra) & available
    for part, unicodes in (("core", core), ("ext", ((LATIN | ext_extra) & available) - core)):
        file = OUT / f"{slug}-{part}.woff2"
        cps = cut(font, unicodes, features, file)
        print(f"{file.name:32} {file.stat().st_size:6} bytes {len(cps):4} codepoints")
        css.setdefault(sheet, []).append(f"""@font-face {{
  font-family: "{family}";
  font-style: {style};
  font-weight: {weight};
  font-display: swap;
  src: url("./fonts/{file.name}") format("woff2");
  unicode-range: {ranges(cps)};
}}
""")

for sheet, faces in css.items():
    path = Path("src") / sheet
    fallbacks = re.sub(r'@font-face \{[^}]*url\("\./fonts/[^}]*\}\n+', "", path.read_text())
    path.write_text("\n".join(faces) + "\n" + fallbacks)
subprocess.run(["bun", "x", "oxfmt", *(f"src/{sheet}" for sheet in css)], check=True)
