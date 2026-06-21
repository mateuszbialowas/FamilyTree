// ======================== SKIA HELPERS ========================
// Wrappers for creating Skia paths and text paragraphs

import { Skia } from '@shopify/react-native-skia';
import type { SkParagraphStyle, SkTextStyle } from '@shopify/react-native-skia';
import { TextAlign } from '@shopify/react-native-skia';

/** Create a Skia Path from an SVG path string. Returns an empty path on failure. */
export function mkPath(d: string) {
  try {
    const p = Skia.Path.MakeFromSVGString(d);
    return p || Skia.Path.Make();
  } catch { return Skia.Path.Make(); }
}

/**
 * Create a Skia Paragraph (centered text block).
 *
 * `maxLines` caps how many lines the text may wrap to; combined with
 * `ellipsis`, overflowing text (e.g. long "z domu …" surnames) is truncated
 * with an ellipsis instead of spilling out of its label box. After layout the
 * caller can read `.getHeight()` to stack rows by their real height.
 */
export function mkPara(
  text: string,
  sz: number,
  col: string,
  w: number,
  bold = false,
  maxLines?: number,
  ellipsis = false,
) {
  const s: SkParagraphStyle = { textAlign: TextAlign.Center };
  if (maxLines != null) s.maxLines = maxLines;
  if (ellipsis) s.ellipsis = '…';
  const ts: SkTextStyle = { fontSize: sz, fontFamilies: ['serif'], color: Skia.Color(col), fontStyle: bold ? { weight: 700 } : { weight: 400 } };
  const p = Skia.ParagraphBuilder.Make(s).pushStyle(ts).addText(text).pop().build();
  p.layout(w);
  return p;
}
