import { sr, lerp, pick, mkPath, P } from './constants';
import type { LeafD, AnimalD } from './constants';
import type { Conn } from '../../utils/treeLayout';

// ======================== TRUNK GENERATION ========================
export function genTrunk(x: number, y1: number, y2: number, bw: number, seed: number, rootDir: 'up' | 'down' | null = null) {
  const r = sr(seed), sg = 28;
  const ctr: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= sg; i++) {
    const t = i / sg, y = lerp(y1, y2, t);
    const rootFlare = t > 0.85 ? 1 + Math.pow((t - 0.85) / 0.15, 0.6) * 1.2 : 1;
    const taper = Math.pow(1 - t, 0.25) * 1.15;
    const waist = 1 - Math.sin(t * Math.PI) * 0.04;
    const topSpread = t < 0.15 ? 1 + (1 - t / 0.15) * 0.3 : 1;
    const bump1 = Math.sin(t * Math.PI * 5.7 + r() * 2) * 1.2 * (r() - 0.3);
    const bump2 = Math.sin(t * Math.PI * 3.1 + r() * 3) * 0.8 * (r() - 0.4);
    const w = bw * taper * waist * rootFlare * topSpread + bump1 + bump2;
    const drift = Math.sin(t * Math.PI * 1.3) * 1.8 + (r() - 0.5) * 1;
    ctr.push({ x: x + drift, y, w });
  }

  let path = `M ${ctr[0].x - ctr[0].w / 2} ${ctr[0].y}`;
  for (let i = 1; i <= sg; i++) {
    const px = ctr[i].x - ctr[i].w / 2;
    const ppx = ctr[i - 1].x - ctr[i - 1].w / 2;
    const cpx = (ppx + px) / 2 + (r() - 0.5) * 1;
    path += ` Q ${cpx} ${(ctr[i - 1].y + ctr[i].y) / 2}, ${px} ${ctr[i].y}`;
  }
  for (let i = sg; i >= 0; i--) {
    const px = ctr[i].x + ctr[i].w / 2;
    if (i === sg) path += ` L ${px} ${ctr[i].y}`;
    else {
      const npx = ctr[i + 1].x + ctr[i + 1].w / 2;
      const cpx = (npx + px) / 2 + (r() - 0.5) * 1;
      path += ` Q ${cpx} ${(ctr[i + 1].y + ctr[i].y) / 2}, ${px} ${ctr[i].y}`;
    }
  }
  path += ' Z';

  const furrows: { d: string; w: number; op: number; dark: boolean }[] = [];
  for (let i = 0; i < 16; i++) {
    const xRatio = (r() - 0.5) * 0.7;
    const t1 = r() * 0.3, t2 = t1 + 0.15 + r() * 0.5;
    let d = '';
    for (let j = 0; j <= 8; j++) {
      const t = lerp(t1, t2, j / 8), idx = Math.min(Math.floor(t * sg), sg);
      const px = ctr[idx].x + xRatio * ctr[idx].w + Math.sin(j * 1.3 + r() * 5) * 0.8;
      d += j === 0 ? `M ${px} ${ctr[idx].y}` : ` L ${px} ${ctr[idx].y}`;
    }
    furrows.push({ d, w: 0.3 + r() * 1.1, op: 0.1 + r() * 0.18, dark: r() > 0.4 });
  }

  const cracks: { d: string; w: number; op: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const t = 0.08 + r() * 0.84, idx = Math.min(Math.floor(t * sg), sg);
    const cy = ctr[idx].y, hw = ctr[idx].w * (0.15 + r() * 0.4);
    const cx = ctr[idx].x + (r() - 0.5) * ctr[idx].w * 0.2;
    cracks.push({
      d: `M ${cx - hw} ${cy + (r() - 0.5) * 2} L ${cx} ${cy + (r() - 0.5) * 2} L ${cx + hw} ${cy + (r() - 0.5) * 2}`,
      w: 0.2 + r() * 0.5, op: 0.06 + r() * 0.08,
    });
  }

  const highlights: { d: string; w: number; op: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const t1 = 0.05 + r() * 0.3, t2 = t1 + 0.15 + r() * 0.3;
    const xRatio = 0.15 + r() * 0.15;
    let d = '';
    for (let j = 0; j <= 5; j++) {
      const t = lerp(t1, t2, j / 5), idx = Math.min(Math.floor(t * sg), sg);
      const px = ctr[idx].x + xRatio * ctr[idx].w + (r() - 0.5) * 1;
      d += j === 0 ? `M ${px} ${ctr[idx].y}` : ` L ${px} ${ctr[idx].y}`;
    }
    highlights.push({ d, w: 1 + r() * 2, op: 0.04 + r() * 0.04 });
  }

  const knots = Array.from({ length: 3 }, () => {
    const t = 0.15 + r() * 0.6, idx = Math.min(Math.floor(t * sg), sg);
    return { cx: ctr[idx].x + (r() - 0.5) * ctr[idx].w * 0.35, cy: ctr[idx].y, rx: 2 + r() * 3, ry: 1.5 + r() * 2.5, op: 0.2 + r() * 0.15, hasRing: r() > 0.3 };
  });

  const moss = Array.from({ length: 5 }, () => {
    const t = 0.15 + r() * 0.55, idx = Math.min(Math.floor(t * sg), sg);
    const side = r() > 0.5 ? 1 : -1;
    return { cx: ctr[idx].x + side * ctr[idx].w * 0.35, cy: ctr[idx].y, rx: 2.5 + r() * 4.5, ry: 1.5 + r() * 3, col: pick(P.moss, r), op: 0.15 + r() * 0.2 };
  });

  const roots: { path: string; barkLines: { d: string; w: number; op: number }[] }[] = [];
  if (rootDir) {
    const yDir = rootDir === 'up' ? -1 : 1;
    const baseY = rootDir === 'up' ? y1 : y2;
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const spread = 0.15 + (i % 4) * 0.2;
      const sx = x + side * (bw * spread + r() * bw * 0.1);
      const sy = baseY + yDir * (-3 + r() * 6);
      const ex = sx + side * (30 + r() * 35);
      const ey = sy + yDir * (15 + r() * 22);
      const thick = 7 + r() * 7;
      const rootSeed = seed + 3000 + i * 17;
      roots.push(genRoot(sx, sy, ex, ey, thick, side, rootSeed));
      // sub-roots
      if (r() > 0.3) {
        const subAng = (r() - 0.3) * 0.5;
        const subLen = 10 + r() * 18;
        const mainAng = Math.atan2(ey - sy, ex - sx);
        const sex = ex + Math.cos(mainAng + subAng * side) * subLen * side;
        const sey = ey + yDir * Math.abs(Math.sin(mainAng + subAng)) * subLen * 0.7;
        roots.push(genRoot(ex, ey, sex, sey, thick * 0.35, side, rootSeed + 99));
      }
    }
  }

  const midW = ctr[Math.floor(sg / 2)].w;
  return { path, furrows, cracks, highlights, knots, moss, roots, midW };
}

// ======================== ROOT GENERATION ========================
function genRoot(sx: number, sy: number, ex: number, ey: number, thick: number, side: number, seed: number) {
  const r = sr(seed), sg = 12;
  const dx = ex - sx, dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx), pA = ang + Math.PI / 2;

  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= sg; i++) {
    const t = i / sg;
    const cx = lerp(sx, ex, t), cy = lerp(sy, ey, t);
    const droop = Math.sin(t * Math.PI) * len * 0.06;
    const wobble = Math.sin(t * Math.PI * 2.7 + r() * 4) * 2 * (r() - 0.3);
    const baseBulge = t < 0.15 ? 1 + (1 - t / 0.15) * 0.6 : 1;
    const taper = Math.pow(1 - t, 0.6);
    const w = thick * taper * baseBulge + (r() - 0.5) * 1.5;
    pts.push({ x: cx + wobble + (r() - 0.5) * 1, y: cy + droop, w: Math.max(1, w) });
  }

  const lPts = pts.map(p => ({ x: p.x - Math.cos(pA) * p.w / 2, y: p.y - Math.sin(pA) * p.w / 2 }));
  const rPts = pts.map(p => ({ x: p.x + Math.cos(pA) * p.w / 2, y: p.y + Math.sin(pA) * p.w / 2 }));

  let path = `M ${lPts[0].x} ${lPts[0].y}`;
  for (let i = 1; i < lPts.length; i++) {
    const mx = (lPts[i - 1].x + lPts[i].x) / 2, my = (lPts[i - 1].y + lPts[i].y) / 2;
    path += ` Q ${lPts[i - 1].x} ${lPts[i - 1].y} ${mx} ${my}`;
  }
  path += ` L ${lPts[sg].x} ${lPts[sg].y}`;
  for (let i = rPts.length - 1; i >= 0; i--) {
    if (i === rPts.length - 1) path += ` L ${rPts[i].x} ${rPts[i].y}`;
    else {
      const mx = (rPts[i + 1].x + rPts[i].x) / 2, my = (rPts[i + 1].y + rPts[i].y) / 2;
      path += ` Q ${rPts[i + 1].x} ${rPts[i + 1].y} ${mx} ${my}`;
    }
  }
  path += ' Z';

  const barkLines: { d: string; w: number; op: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const t1 = r() * 0.3, t2 = t1 + 0.15 + r() * 0.45;
    const offRatio = (r() - 0.5) * 0.5;
    let d = '';
    for (let j = 0; j <= 4; j++) {
      const t = lerp(t1, t2, j / 4), idx = Math.min(Math.floor(t * sg), sg);
      const px = pts[idx].x + offRatio * pts[idx].w + (r() - 0.5) * 0.6;
      d += j === 0 ? `M ${px} ${pts[idx].y}` : ` L ${px} ${pts[idx].y}`;
    }
    barkLines.push({ d, w: 0.2 + r() * 0.5, op: 0.08 + r() * 0.12 });
  }

  return { path, barkLines };
}

// ======================== BRANCH GENERATION ========================
export function genBranch(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const r = sr(seed), sg = 18;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const thick = Math.max(4, 12 - len / 40);
  const ang = Math.atan2(dy, dx), pA = ang + Math.PI / 2;

  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= sg; i++) {
    const t = i / sg, ease = t * t * (3 - 2 * t);
    const cx = lerp(x1, x2, ease), cy = lerp(y1, y2, t);
    const grav = Math.sin(t * Math.PI) * len * 0.035;
    const bend = (x2 > x1 ? 1 : -1) * Math.sin(t * Math.PI) * 7;
    const sCurve = Math.sin(t * Math.PI * 2.3) * 2.5 * (r() - 0.3);
    const jBulge = t < 0.1 ? 1 + (1 - t / 0.1) * 0.5 : 1;
    const midBulge = 1 + Math.sin(t * Math.PI) * 0.08;
    const tipTaper = t > 0.8 ? Math.pow(1 - (t - 0.8) / 0.2, 0.5) : 1;
    const w = thick * (1 - t * 0.5) * jBulge * midBulge * tipTaper;
    pts.push({ x: cx + bend + sCurve + (r() - 0.5) * 1.5, y: cy + grav, w });
  }

  const lPts = pts.map(p => ({ x: p.x - Math.cos(pA) * p.w / 2, y: p.y - Math.sin(pA) * p.w / 2 }));
  const rPts = pts.map(p => ({ x: p.x + Math.cos(pA) * p.w / 2, y: p.y + Math.sin(pA) * p.w / 2 }));

  let path = `M ${lPts[0].x} ${lPts[0].y}`;
  for (let i = 1; i < lPts.length; i++) {
    const mx = (lPts[i - 1].x + lPts[i].x) / 2, my = (lPts[i - 1].y + lPts[i].y) / 2;
    path += ` Q ${lPts[i - 1].x} ${lPts[i - 1].y} ${mx} ${my}`;
  }
  path += ` L ${lPts[sg].x} ${lPts[sg].y}`;
  for (let i = rPts.length - 1; i >= 0; i--) {
    if (i === rPts.length - 1) path += ` L ${rPts[i].x} ${rPts[i].y}`;
    else {
      const mx = (rPts[i + 1].x + rPts[i].x) / 2, my = (rPts[i + 1].y + rPts[i].y) / 2;
      path += ` Q ${rPts[i + 1].x} ${rPts[i + 1].y} ${mx} ${my}`;
    }
  }
  path += ' Z';

  const barkLines: { d: string; w: number; op: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const t1 = r() * 0.35, t2 = t1 + 0.1 + r() * 0.4;
    const offRatio = (r() - 0.5) * 0.5;
    let d = '';
    for (let j = 0; j <= 6; j++) {
      const t = lerp(t1, t2, j / 6), idx = Math.min(Math.floor(t * sg), sg);
      const px = pts[idx].x + offRatio * pts[idx].w + (r() - 0.5) * 0.8;
      d += j === 0 ? `M ${px} ${pts[idx].y}` : ` L ${px} ${pts[idx].y}`;
    }
    barkLines.push({ d, w: 0.2 + r() * 0.6, op: 0.06 + r() * 0.1 });
  }

  const twigs: { d: string; w: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const t = 0.25 + r() * 0.55, idx = Math.min(Math.floor(t * sg), sg), p = pts[idx];
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

  return { path, barkLines, twigs };
}

// ======================== LEAF SYSTEM ========================
export function genCanopy(cx: number, cy: number, rx: number, ry: number, count: number, seed: number): LeafD[] {
  const r = sr(seed);
  const leaves: LeafD[] = [];
  for (let layer = 0; layer < 3; layer++) {
    const n = layer === 0 ? Math.floor(count * 0.3) : layer === 1 ? Math.floor(count * 0.4) : Math.floor(count * 0.3);
    const layerRx = rx * (1.1 - layer * 0.15);
    const layerRy = ry * (1.1 - layer * 0.15);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const dx = Math.cos(a) * layerRx * (0.15 + r() * 0.85);
      const dy = Math.sin(a) * layerRy * (0.15 + r() * 0.85);
      const baseSz = layer === 0 ? 8 + r() * 10 : layer === 1 ? 6 + r() * 9 : 5 + r() * 7;
      const colPool = layer === 0 ? [P.leaf.deep, P.leaf.darkA, P.leaf.darkB]
        : layer === 1 ? [P.leaf.midA, P.leaf.midB, P.leaf.midC]
        : [P.leaf.lightA, P.leaf.lightB, P.leaf.bright, P.leaf.highlight];
      leaves.push({
        x: cx + dx + (r() - 0.5) * 8,
        y: cy + dy + (r() - 0.5) * 6,
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
export function placeAnimals(conns: Conn[]): AnimalD[] {
  const a: AnimalD[] = [];
  const br = conns.filter(c => c.type === 'branch');
  const tr = conns.filter(c => c.type === 'trunk');
  const r = sr(br.length * 7 + 42);
  const types: AnimalD['type'][] = ['bird', 'squirrel', 'bird'];
  if (tr.length > 0) a.push({ type: 'owl', x: tr[0].x1 + 16, y: (tr[0].y1 + tr[0].y2) / 2 + 40, flip: false, seed: tr[0].seed });
  for (let i = 0; i < br.length; i++) {
    if (r() > 0.6) continue;
    const b = br[i];
    const t = 0.35 + r() * 0.3;
    const type = types[Math.floor(r() * types.length)];
    const yOff = type === 'squirrel' ? -11 : -9;
    a.push({ type, x: lerp(b.x1, b.x2, t), y: lerp(b.y1, b.y2, t) + yOff, flip: r() > 0.5, seed: b.seed + i * 13 });
  }
  return a;
}
