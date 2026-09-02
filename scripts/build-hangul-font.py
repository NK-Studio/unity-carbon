#!/usr/bin/env python3
"""Merge Sarasa Mono K's Hangul into JetBrains Mono.

The editor font has to keep JetBrains Mono's Latin glyphs while drawing Hangul on the
same monospace grid: JetBrains Mono advances 600/1000 em, so a Hangul syllable has to
occupy exactly two cells (1200). Sarasa draws its CJK glyphs full-width at 1000, so
every outline it contributes is scaled by 1.2.

This replaces the D2Coding-based build that shipped before (Jhyub/JetBrainsMonoHangul).

    python3 scripts/build-hangul-font.py \
        --latin /tmp/jbm/fonts/ttf/JetBrainsMono-Regular.ttf \
        --hangul /tmp/sarasa/SarasaMonoK-Regular.ttf \
        --out public/static/fonts/JetBrainsMonoHangul-Regular.ttf

Both sources are SIL OFL; download them from:
  https://github.com/JetBrains/JetBrainsMono/releases
  https://github.com/be5invis/Sarasa-Gothic/releases   (SarasaMonoK-TTF-*.7z)
"""

import argparse
import datetime

from fontTools.misc.transform import Scale
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

# conjoining jamo, compatibility jamo, jamo extended-A/B and the syllable block
HANGUL_RANGES = [
    (0x1100, 0x11FF),
    (0x3130, 0x318F),
    (0xA960, 0xA97F),
    (0xAC00, 0xD7A3),
    (0xD7B0, 0xD7FF),
]
# the half-width forms of the compatibility jamo would collide with the Latin grid
GLYPH_PREFIX = "hangul."

FAMILY_NAME = "JetBrainsMonoHangul"


def hangul_codepoints(font):
    available = font.getBestCmap()
    return [cp for start, end in HANGUL_RANGES for cp in range(start, end + 1) if cp in available]


def subset_to_hangul(font, codepoints):
    options = Options()
    options.glyph_names = True
    options.notdef_outline = True
    options.recalc_bounds = True
    options.layout_features = []
    options.name_IDs = ["*"]
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)


def scaled_glyphs(font, scale):
    """Every Hangul glyph, decomposed and scaled, keyed by its new name."""
    glyph_set = font.getGlyphSet()
    hmtx = font["hmtx"]
    cmap = font.getBestCmap()

    glyphs = {}
    mapping = {}
    for codepoint, source_name in sorted(cmap.items()):
        name = GLYPH_PREFIX + source_name
        mapping[codepoint] = name
        if name in glyphs:
            continue

        # components would be scaled twice, once here and once through the base glyph
        recording = DecomposingRecordingPen(glyph_set)
        glyph_set[source_name].draw(recording)
        pen = TTGlyphPen(None)
        recording.replay(TransformPen(pen, Scale(scale)))

        advance, left_side_bearing = hmtx[source_name]
        glyphs[name] = (pen.glyph(), round(advance * scale), round(left_side_bearing * scale))

    return glyphs, mapping


def merge(base, glyphs, mapping):
    glyf = base["glyf"]
    hmtx = base["hmtx"]
    order = base.getGlyphOrder()

    added = [name for name in glyphs if name not in glyf.glyphs]
    for name in added:
        glyph, advance, left_side_bearing = glyphs[name]
        glyf.glyphs[name] = glyph
        hmtx.metrics[name] = (advance, left_side_bearing)

    base.setGlyphOrder(list(order) + added)
    # the reverse map is cached from the old order
    if hasattr(base, "_reverseGlyphOrderDict"):
        del base._reverseGlyphOrderDict

    for table in base["cmap"].tables:
        if table.isUnicode():
            table.cmap.update(mapping)

    return added


def mark_korean_coverage(base):
    os2 = base["OS/2"]
    # ulUnicodeRange: bit 28 Hangul Jamo, bit 56 Hangul Syllables, bit 57 Jamo Extended
    os2.ulUnicodeRange1 |= 1 << 28
    os2.ulUnicodeRange2 |= (1 << (56 - 32)) | (1 << (57 - 32))
    # ulCodePageRange: bit 19 Korean Wansung, bit 21 Korean Johab
    os2.ulCodePageRange1 |= (1 << 19) | (1 << 21)


def rename(base, version_note):
    name = base["name"]
    values = {
        1: FAMILY_NAME,
        3: f"{FAMILY_NAME} Regular {version_note}",
        4: f"{FAMILY_NAME} Regular",
        6: f"{FAMILY_NAME}-Regular",
        16: FAMILY_NAME,
    }
    for name_id, value in values.items():
        name.setName(value, name_id, 3, 1, 0x409)
        name.setName(value, name_id, 1, 0, 0)

    existing = name.getDebugName(5) or ""
    name.setName(f"{existing}; Sarasa Hangul {version_note}", 5, 3, 1, 0x409)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--latin", required=True, help="JetBrains Mono TTF")
    parser.add_argument("--hangul", required=True, help="Sarasa Mono K TTF")
    parser.add_argument("--out", required=True, help="where to write the merged TTF")
    parser.add_argument(
        "--scale",
        type=float,
        default=None,
        help="Hangul scale factor (default: two Latin cells / Hangul advance)",
    )
    arguments = parser.parse_args()

    base = TTFont(arguments.latin)
    hangul = TTFont(arguments.hangul)

    if base["head"].unitsPerEm != hangul["head"].unitsPerEm:
        raise SystemExit("both fonts must share a units-per-em")

    codepoints = hangul_codepoints(hangul)
    if not codepoints:
        raise SystemExit("the Hangul source covers none of the Hangul blocks")

    latin_advance = base["hmtx"][base.getBestCmap()[ord("A")]][0]
    hangul_advance = hangul["hmtx"][hangul.getBestCmap()[ord("가")]][0]
    scale = arguments.scale or (latin_advance * 2) / hangul_advance

    subset_to_hangul(hangul, codepoints)
    glyphs, mapping = scaled_glyphs(hangul, scale)
    added = merge(base, glyphs, mapping)

    mark_korean_coverage(base)
    rename(base, datetime.date.today().strftime("%Y%m%d"))

    base.save(arguments.out)
    print(
        f"{len(added)} Hangul glyphs at {scale:g}x "
        f"({hangul_advance} → {round(hangul_advance * scale)} vs {latin_advance * 2} for two cells)"
    )
    print(f"wrote {arguments.out}")


if __name__ == "__main__":
    main()
