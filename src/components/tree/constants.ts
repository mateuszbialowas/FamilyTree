import { Skia } from '@shopify/react-native-skia';
import type { SkParagraphStyle, SkTextStyle } from '@shopify/react-native-skia';
import { TextAlign } from '@shopify/react-native-skia';

// ======================== PALETTE ========================
export const P = {
  bark: {
    deep: '#1C0F05', shadow: '#2E1B0E', dark: '#3E2723',
    mid: '#5D4037', light: '#795548', highlight: '#A1887F',
    edge: '#4A3728',
  },
  leaf: {
    deep: '#1B5E20', darkA: '#2E7D32', darkB: '#33691E',
    midA: '#388E3C', midB: '#43A047', midC: '#558B2F',
    lightA: '#66BB6A', lightB: '#7CB342', lightC: '#81C784',
    bright: '#8BC34A', highlight: '#AED581',
  },
  moss: ['#6B8E23', '#556B2F', '#7B9F35', '#8FBC8F'],
  cream: '#fdf6e3', parch: '#f4e8c1', parchDk: '#e6d5a8', parchEdge: '#d4c08f',
  ink: '#3b2a1a', inkFade: '#8b7a6a',
  sepia: '#8b6914', sepiaLt: '#c4a035', red: '#8b3a2a',
  owl: { body: '#7B6B5A', bodyDk: '#5C4D3C', breast: '#C4B098', face: '#D4C4A8', eye: '#F5C518', eyeRing: '#E8B50A', pupil: '#1A1A1A', beak: '#C49A2A', feet: '#9E8E6E' },
  bird: { body: '#C75B4A', bodyDk: '#A04535', breast: '#E8A870', wing: '#8B4535', wingDk: '#6B3025', tail: '#7B3B2B', beak: '#E8B040', eye: '#1A1A1A' },
  squirrel: { body: '#A0622A', bodyDk: '#7A4A1E', belly: '#D4A860', tail: '#8B5220', tailLight: '#C08040', ear: '#C48838', nose: '#2A1A0A', eye: '#1A1A1A' },
  hl: { ring: '#DAA520', glow: 'rgba(218,165,32,0.25)' },
};

// ======================== UTILS ========================
export function sr(seed: number) {
  let s = seed || 42;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function pick<T>(a: T[], r: () => number): T { return a[Math.floor(r() * a.length)]; }

export function mkPath(d: string) {
  try {
    const p = Skia.Path.MakeFromSVGString(d);
    return p || Skia.Path.Make();
  } catch { return Skia.Path.Make(); }
}

export function mkPara(text: string, sz: number, col: string, w: number, bold = false) {
  const s: SkParagraphStyle = { textAlign: TextAlign.Center };
  const ts: SkTextStyle = { fontSize: sz, fontFamilies: ['serif'], color: Skia.Color(col), fontStyle: bold ? { weight: 700 } : { weight: 400 } };
  const p = Skia.ParagraphBuilder.Make(s).pushStyle(ts).addText(text).pop().build();
  p.layout(w);
  return p;
}

// ======================== TYPES ========================
export interface LeafD {
  x: number; y: number; sz: number; rot: number;
  col: string; type: number; op: number; layer: number;
}

export interface AnimalD {
  type: 'owl' | 'bird' | 'squirrel';
  x: number; y: number; flip: boolean; seed: number;
}
