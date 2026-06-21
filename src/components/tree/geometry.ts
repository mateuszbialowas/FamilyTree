import { sr, lerp, pick } from './mathHelpers';
import { mkPath } from './skiaHelpers';
import { P } from './palette';
import type { LeafD, AnimalD } from './palette';

// ======================== GEOMETRY CONSTANTS ========================

/** Number of segments used to construct branch shape */
const BRANCH_SEGMENTS = 18;

/** Number of bark lines on each branch */
const BARK_LINE_COUNT = 10;

/** Number of twigs per branch */
const TWIG_COUNT = 5;

/** Number of canopy layers (deep, mid, light) */
const CANOPY_LAYERS = 3;

/** Animal placement position along branch (0-1) */
const ANIMAL_BRANCH_POSITION = 0.35;

/** Probability threshold for skipping animal placement on a branch */
const ANIMAL_SKIP_THRESHOLD = 0.6;

// ======================== BRANCH GENERATION ========================
export function genBranch(x1: number, y1: number, x2: number, y2: number, seed: number, thickAtStart = true) {
  const r = sr(seed);
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const thick = Math.max(7, 18 - len / 40);
  const ang = Math.atan2(dy, dx), pA = ang + Math.PI / 2;

  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= BRANCH_SEGMENTS; i++) {
    const t = i / BRANCH_SEGMENTS, ease = t * t * (3 - 2 * t);
    const cx = lerp(x1, x2, ease), cy = lerp(y1, y2, t);
    const grav = Math.sin(t * Math.PI) * len * 0.035;
    const bend = (x2 > x1 ? 1 : -1) * Math.sin(t * Math.PI) * 7;
    const sCurve = Math.sin(t * Math.PI * 2.3) * 2.5 * (r() - 0.3);
    // Taper direction: tw goes 1→0 from thick end to thin end
    const tw = thickAtStart ? 1 - t : t;
    const jBulge = tw > 0.9 ? 1 + ((tw - 0.9) / 0.1) * 0.3 : 1;
    const midBulge = 1 + Math.sin(t * Math.PI) * 0.08;
    const tipTaper = tw < 0.2 ? Math.pow(tw / 0.2, 0.5) : 1;
    const w = thick * (0.35 + tw * 0.45) * jBulge * midBulge * tipTaper;
    pts.push({ x: cx + bend + sCurve + (r() - 0.5) * 1.5, y: cy + grav, w });
  }

  const lPts = pts.map(p => ({ x: p.x - Math.cos(pA) * p.w / 2, y: p.y - Math.sin(pA) * p.w / 2 }));
  const rPts = pts.map(p => ({ x: p.x + Math.cos(pA) * p.w / 2, y: p.y + Math.sin(pA) * p.w / 2 }));

  let path = `M ${lPts[0].x} ${lPts[0].y}`;
  for (let i = 1; i < lPts.length; i++) {
    const mx = (lPts[i - 1].x + lPts[i].x) / 2, my = (lPts[i - 1].y + lPts[i].y) / 2;
    path += ` Q ${lPts[i - 1].x} ${lPts[i - 1].y} ${mx} ${my}`;
  }
  path += ` L ${lPts[BRANCH_SEGMENTS].x} ${lPts[BRANCH_SEGMENTS].y}`;
  for (let i = rPts.length - 1; i >= 0; i--) {
    if (i === rPts.length - 1) path += ` L ${rPts[i].x} ${rPts[i].y}`;
    else {
      const mx = (rPts[i + 1].x + rPts[i].x) / 2, my = (rPts[i + 1].y + rPts[i].y) / 2;
      path += ` Q ${rPts[i + 1].x} ${rPts[i + 1].y} ${mx} ${my}`;
    }
  }
  path += ' Z';

  const barkLines: { d: string; w: number; op: number }[] = [];
  for (let i = 0; i < BARK_LINE_COUNT; i++) {
    const t1 = r() * 0.35, t2 = t1 + 0.1 + r() * 0.4;
    const offRatio = (r() - 0.5) * 0.5;
    let d = '';
    for (let j = 0; j <= 6; j++) {
      const t = lerp(t1, t2, j / 6), idx = Math.min(Math.floor(t * BRANCH_SEGMENTS), BRANCH_SEGMENTS);
      const px = pts[idx].x + offRatio * pts[idx].w + (r() - 0.5) * 0.8;
      d += j === 0 ? `M ${px} ${pts[idx].y}` : ` L ${px} ${pts[idx].y}`;
    }
    barkLines.push({ d, w: 0.2 + r() * 0.6, op: 0.06 + r() * 0.1 });
  }

  const twigs: { d: string; w: number }[] = [];
  for (let i = 0; i < TWIG_COUNT; i++) {
    const t = 0.25 + r() * 0.55, idx = Math.min(Math.floor(t * BRANCH_SEGMENTS), BRANCH_SEGMENTS), p = pts[idx];
    const side = r() > 0.5 ? 1 : -1;
    const tl = 4 + r() * 10, ta = ang + side * (0.2 + r() * 0.45);
    const tipW = 0.3 + r() * 0.6;
    const ex = p.x + Math.cos(ta) * tl, ey = p.y + Math.sin(ta) * tl;
    const cpx = (p.x + ex) / 2 + (r() - 0.5) * 2, cpy = (p.y + ey) / 2 + (r() - 0.5) * 2;
    twigs.push({ d: `M ${p.x} ${p.y} Q ${cpx} ${cpy}, ${ex} ${ey}`, w: tipW });
    if (r() > 0.6) {
      const stl = 2 + r() * 5, sta = ta + (r() - 0.5) * 0.6;
      const sex = ex + Math.cos(sta) * stl, sey = ey + Math.sin(sta) * stl;
      twigs.push({ d: `M ${ex} ${ey} Q ${(ex + sex) / 2 + (r() - 0.5)} ${(ey + sey) / 2 + (r() - 0.5)}, ${sex} ${sey}`, w: tipW * 0.5 });
    }
  }

  // `centerline` is the exact curve the branch is drawn along (with the
  // gravity sag + bend). Decorations sit on these points so they never float
  // above long, sagging branches — no need to recompute the curve elsewhere.
  const centerline = pts.map(p => ({ x: p.x, y: p.y }));
  return { path, barkLines, twigs, centerline };
}

// ======================== LEAF SYSTEM ========================
export function genCanopy(cx: number, cy: number, rx: number, ry: number, count: number, seed: number): LeafD[] {
  const r = sr(seed);
  const leaves: LeafD[] = [];
  for (let layer = 0; layer < CANOPY_LAYERS; layer++) {
    const n = layer === 0 ? Math.floor(count * 0.3) : layer === 1 ? Math.floor(count * 0.4) : Math.floor(count * 0.3);
    const layerRx = rx * (1.1 - layer * 0.15);
    const layerRy = ry * (1.1 - layer * 0.15);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const ddx = Math.cos(a) * layerRx * (0.15 + r() * 0.85);
      const ddy = Math.sin(a) * layerRy * (0.15 + r() * 0.85);
      const baseSz = layer === 0 ? 8 + r() * 10 : layer === 1 ? 6 + r() * 9 : 5 + r() * 7;
      const colPool = layer === 0 ? [P.leaf.deep, P.leaf.darkA, P.leaf.darkB]
        : layer === 1 ? [P.leaf.midA, P.leaf.midB, P.leaf.midC]
        : [P.leaf.lightA, P.leaf.lightB, P.leaf.bright, P.leaf.highlight];
      leaves.push({
        x: cx + ddx + (r() - 0.5) * 8,
        y: cy + ddy + (r() - 0.5) * 6,
        sz: baseSz, rot: r() * 360,
        col: pick(colPool, r),
        type: Math.floor(r() * 3),
        op: layer === 0 ? 0.5 + r() * 0.2 : layer === 1 ? 0.6 + r() * 0.25 : 0.7 + r() * 0.25,
        layer,
      });
    }
  }
  return leaves;
}

export function leafPath(sz: number, type: number) {
  const w = sz * 0.42;
  if (type === 0) return mkPath(`M 0,0 C ${-w},${-sz * 0.25} ${-w * 0.9},${-sz * 0.65} ${-w * 0.12},${-sz * 0.92} Q 0,${-sz * 1.06} ${w * 0.12},${-sz * 0.92} C ${w * 0.9},${-sz * 0.65} ${w},${-sz * 0.25} 0,0 Z`);
  if (type === 1) return mkPath(`M 0,0 C ${-w * 1.15},${-sz * 0.32} ${-w * 0.8},${-sz * 0.78} 0,${-sz} C ${w * 0.8},${-sz * 0.78} ${w * 1.15},${-sz * 0.32} 0,0 Z`);
  return mkPath(`M 0,0 C ${-w * 1.25},${-sz * 0.38} ${-w * 0.65},${-sz * 0.82} 0,${-sz} C ${w * 0.65},${-sz * 0.82} ${w * 1.25},${-sz * 0.38} 0,0 Z`);
}

export function leafVeinPath(sz: number) { return mkPath(`M 0,${-sz * 0.08} L 0,${-sz * 0.82}`); }

// ======================== ANIMAL PLACEMENT ========================
/** A generated branch carrying its drawn centreline (from genBranch). */
export interface BranchGeo {
  x1: number; y1: number; x2: number; y2: number; seed: number;
  centerline: { x: number; y: number }[];
}

export function placeAnimals(branches: BranchGeo[]): AnimalD[] {
  const a: AnimalD[] = [];
  const br = branches;
  const r = sr(br.length * 7 + 42);
  const types: AnimalD['type'][] = ['bird', 'squirrel', 'bird'];
  const MIN_DIST = 40; // minimum distance between animals

  const tooClose = (x: number, y: number) =>
    a.some(e => Math.abs(e.x - x) < MIN_DIST && Math.abs(e.y - y) < MIN_DIST);
  // Point on the branch's own drawn centreline at parameter t (0..1).
  const at = (b: BranchGeo, t: number) =>
    b.centerline[Math.round(t * (b.centerline.length - 1))];

  // Place owl on a branch so it sits naturally
  if (br.length > 0) {
    const owlBr = br[Math.floor(br.length / 2)];
    const p = at(owlBr, 0.55);
    a.push({ type: 'owl', x: p.x, y: p.y - 4, flip: owlBr.x2 < owlBr.x1, seed: owlBr.seed });
  }
  for (let i = 0; i < br.length; i++) {
    if (r() > ANIMAL_SKIP_THRESHOLD) continue;
    const b = br[i];
    const t = ANIMAL_BRANCH_POSITION + r() * 0.3;
    const type = types[Math.floor(r() * types.length)];
    const yOff = type === 'squirrel' ? -11 : -9;
    const p = at(b, t);
    const ax = p.x;
    const ay = p.y + yOff;
    if (tooClose(ax, ay)) continue;
    a.push({ type, x: ax, y: ay, flip: r() > 0.5, seed: b.seed + i * 13 });
  }
  return a;
}
