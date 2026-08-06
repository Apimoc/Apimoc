#!/usr/bin/env python3
"""
Subset the self-hosted fonts.

Two reductions, both safe:

1. Character set. Fontsource's "latin" files carry the whole Latin-1 block
   plus a pile of punctuation and symbols this site never sets. The site is
   English with a small set of typographic marks, so the coverage below is
   generous and still much smaller.

2. Variable axis ranges. Fraunces ships opsz 9-144 and wght 100-900. The
   design uses opsz 14 to 144 and weights 400 to 600. Narrowing the ranges
   drops interpolation data for instances that are never requested. The WONK
   axis is already absent from the opsz source file, which is why that file
   is the one being subset.

Run this after changing which weights or optical sizes the design uses:

    python3 scripts/subset-fonts.py

Requires:  pip install fonttools brotli
"""

import sys
from io import BytesIO
from pathlib import Path

from fontTools.subset import Subsetter, Options, parse_unicodes
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

OUT = Path("public/fonts")
SRC = Path("node_modules/@fontsource-variable")

# Latin basic, the accented letters names actually need, plus the quotes,
# dashes, arrow and middle dot the design sets.
UNICODES = (
    "U+0020-007E,"      # basic latin
    "U+00A0,U+00A9,"    # nbsp, copyright
    "U+00AB,U+00BB,"    # guillemets
    "U+00B7,"           # middle dot, used in the stack label
    "U+00C0-00FF,"      # accented latin, for names
    "U+0152-0153,"      # OE ligature
    "U+2013-2014,"      # en dash, em dash
    "U+2018-201A,"      # single quotes
    "U+201C-201E,"      # double quotes
    "U+2022,U+2026,"    # bullet, ellipsis
    "U+2190-2193,"      # arrows
    "U+00AE,U+2122"     # registered, trademark
)

JOBS = [
    (SRC / "fraunces/files/fraunces-latin-opsz-normal.woff2",
     "fraunces-latin-opsz-normal.woff2",
     {"opsz": (14, 14, 144), "wght": (400, 400, 700)}),

    (SRC / "fraunces/files/fraunces-latin-opsz-italic.woff2",
     "fraunces-latin-opsz-italic.woff2",
     {"opsz": (14, 14, 144), "wght": (400, 400, 700)}),

    (SRC / "instrument-sans/files/instrument-sans-latin-wght-normal.woff2",
     "instrument-sans-latin-wght-normal.woff2",
     {"wght": (400, 400, 700)}),

    (SRC / "instrument-sans/files/instrument-sans-latin-wght-italic.woff2",
     "instrument-sans-latin-wght-italic.woff2",
     {"wght": (400, 400, 700)}),

    # Literata is journal-only and never preloaded, so its range stays wide.
    (SRC / "literata/files/literata-latin-opsz-normal.woff2",
     "literata-latin-opsz-normal.woff2",
     {"wght": (400, 400, 700)}),

    (SRC / "literata/files/literata-latin-opsz-italic.woff2",
     "literata-latin-opsz-italic.woff2",
     {"wght": (400, 400, 700)}),
]


def build(source: Path, name: str, limits: dict, narrow_axes: bool = True) -> tuple[int, int, bool]:
    before = source.stat().st_size
    font = TTFont(source)

    # Keep only the axis ranges the design actually interpolates across.
    applied = False
    if narrow_axes:
        available = {a.axisTag for a in font["fvar"].axes} if "fvar" in font else set()
        applicable = {k: v for k, v in limits.items() if k in available}
        if applicable:
            instantiateVariableFont(
                font, applicable, inplace=True, updateFontNames=False
            )
            applied = True

    options = Options()
    options.flavor = "woff2"
    options.hinting = False
    options.desubroutinize = True
    options.layout_features = ["kern", "liga", "calt", "tnum", "zero", "onum", "frac"]

    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=parse_unicodes(UNICODES))
    subsetter.subset(font)

    buffer = BytesIO()
    font.flavor = "woff2"
    font.save(buffer)
    target = OUT / name
    target.write_bytes(buffer.getvalue())
    return before, target.stat().st_size, applied


OUT.mkdir(parents=True, exist_ok=True)
total_before = total_after = 0

for source, name, limits in JOBS:
    if not source.exists():
        print(f"  missing: {source}", file=sys.stderr)
        sys.exit(1)
    try:
        before, after, narrowed = build(source, name, limits)
    except KeyError:
        # Some fonts carry glyph references that fontTools cannot reconcile
        # between partial instancing and subsetting. The character-set
        # reduction is the larger win anyway, so fall back to that rather
        # than shipping the unsubset original.
        before, after, narrowed = build(source, name, limits, narrow_axes=False)
    total_before += before
    total_after += after
    note = "" if narrowed else "   (charset only, axis ranges kept)"
    print(f"  {name:46} {before // 1024:>4} kB -> {after // 1024:>4} kB{note}")

saved = total_before - total_after
print(
    f"\n  total {total_before // 1024} kB -> {total_after // 1024} kB "
    f"({saved // 1024} kB saved, {saved * 100 // total_before}%)"
)
