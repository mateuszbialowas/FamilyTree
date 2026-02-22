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

  const midW = ctr[Math.floor(sg / 2)].w;
  return { path, furrows, cracks, highlights, knots, moss, rootDir, midW };
}

// ======================== ROOT GENERATION ========================
// Generate organic root paths that grow directly from the trunk base.
// Each root is a filled shape that starts wide at the trunk and tapers to a thin tip,
// with natural curvature and sub-roots branching off.
export function genRoots(
  x: number, baseY: number, bw: number, seed: number, dir: 'up' | 'down',
) {
  const r = sr(seed + 777);
  const flip = dir === 'up' ? -1 : 1;
  const roots: string[] = [];

  // Main roots: 6-8 thick roots fanning out
  const mainCount = 6 + Math.floor(r() * 3);
  for (let i = 0; i < mainCount; i++) {
    const t = i / (mainCount - 1); // 0..1
    const angle = (t - 0.5) * Math.PI * 0.8; // fan: -72° to +72°

    // Start inside the trunk base (overlapping)
    const startX = x + (t - 0.5) * bw * 0.8;
    const startY = baseY - flip * 5; // start slightly inside trunk

    // Main root extends 50-120px
    const reach = 50 + r() * 70;
    const endX = startX + Math.sin(angle) * reach;
    const endY = baseY + flip * Math.abs(Math.cos(angle)) * reach * 0.6 + flip * reach * 0.4;

    // Thickness: thick at trunk, thin at tip
    const startW = 6 + r() * 6 + (1 - Math.abs(t - 0.5) * 2) * 4; // center roots thicker
    const endW = 0.5 + r() * 1;

    // Two control points for S-curve
    const cp1X = lerp(startX, endX, 0.3) + (r() - 0.5) * 15;
    const cp1Y = lerp(startY, endY, 0.25) + flip * r() * 8;
    const cp2X = lerp(startX, endX, 0.65) + (r() - 0.5) * 12;
    const cp2Y = lerp(startY, endY, 0.7) + flip * r() * 6;

    // Build filled shape using cubic beziers for both edges
    const segments = 12;
    const leftPts: { x: number; y: number }[] = [];
    const rightPts: { x: number; y: number }[] = [];

    for (let j = 0; j <= segments; j++) {
      const s = j / segments;
      // Cubic bezier interpolation
      const s1 = (1 - s), s2 = s1 * s1, s3 = s2 * s1;
      const t1 = s, t2 = t1 * t1, t3 = t2 * t1;
      const bx = s3 * startX + 3 * s2 * t1 * cp1X + 3 * s1 * t2 * cp2X + t3 * endX;
      const by = s3 * startY + 3 * s2 * t1 * cp1Y + 3 * s1 * t2 * cp2Y + t3 * endY;
      const w = lerp(startW, endW, s * s); // quadratic taper

      // Perpendicular direction at this point
      const ds = 0.01;
      const s_n = Math.min(s + ds, 1), s1n = 1 - s_n, s2n = s1n * s1n, s3n = s2n * s1n;
      const t1n = s_n, t2n = t1n * t1n, t3n = t2n * t1n;
      const nx = s3n * startX + 3 * s2n * t1n * cp1X + 3 * s1n * t2n * cp2X + t3n * endX;
      const ny = s3n * startY + 3 * s2n * t1n * cp1Y + 3 * s1n * t2n * cp2Y + t3n * endY;
      const dx = nx - bx, dy = ny - by;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len, py = dx / len;

      // Add wobble for organic feel
      const wobble = Math.sin(s * Math.PI * 3 + r() * 4) * 0.8;

      leftPts.push({ x: bx - px * (w / 2 + wobble), y: by - py * (w / 2 + wobble) });
      rightPts.push({ x: bx + px * (w / 2 + wobble), y: by + py * (w / 2 + wobble) });
    }

    // Build path: left edge forward, right edge backward
    let d = `M ${leftPts[0].x} ${leftPts[0].y}`;
    for (let j = 1; j < leftPts.length; j++) {
      d += ` L ${leftPts[j].x} ${leftPts[j].y}`;
    }
    d += ` L ${rightPts[rightPts.length - 1].x} ${rightPts[rightPts.length - 1].y}`;
    for (let j = rightPts.length - 2; j >= 0; j--) {
      d += ` L ${rightPts[j].x} ${rightPts[j].y}`;
    }
    d += ' Z';
    roots.push(d);

    // Sub-roots: 1-2 smaller branches off each main root
    const subCount = 1 + Math.floor(r() * 2);
    for (let si = 0; si < subCount; si++) {
      const branchT = 0.3 + r() * 0.5; // branch off at 30-80% along main root
      const bs = branchT;
      const bs1 = 1 - bs, bs2 = bs1 * bs1, bs3 = bs2 * bs1;
      const bt1 = bs, bt2 = bt1 * bt1, bt3 = bt2 * bt1;
      const brX = bs3 * startX + 3 * bs2 * bt1 * cp1X + 3 * bs1 * bt2 * cp2X + bt3 * endX;
      const brY = bs3 * startY + 3 * bs2 * bt1 * cp1Y + 3 * bs1 * bt2 * cp2Y + bt3 * endY;

      const subAngle = angle + (r() - 0.5) * 1.2;
      const subReach = 15 + r() * 30;
      const subEndX = brX + Math.sin(subAngle) * subReach;
      const subEndY = brY + flip * Math.abs(Math.cos(subAngle)) * subReach * 0.5 + flip * subReach * 0.3;
      const subStartW = lerp(startW, endW, branchT * branchT) * 0.6;
      const subEndW = 0.3 + r() * 0.5;

      const subCpX = lerp(brX, subEndX, 0.5) + (r() - 0.5) * 8;
      const subCpY = lerp(brY, subEndY, 0.5) + flip * r() * 5;

      // Simplified sub-root shape
      const subSegs = 6;
      const sLeftPts: { x: number; y: number }[] = [];
      const sRightPts: { x: number; y: number }[] = [];
      for (let j = 0; j <= subSegs; j++) {
        const ss = j / subSegs;
        const sx = (1 - ss) * (1 - ss) * brX + 2 * (1 - ss) * ss * subCpX + ss * ss * subEndX;
        const sy = (1 - ss) * (1 - ss) * brY + 2 * (1 - ss) * ss * subCpY + ss * ss * subEndY;
        const sw = lerp(subStartW, subEndW, ss * ss);
        const sdx = ss < 0.99 ? (2 * (1 - ss) * (subCpX - brX) + 2 * ss * (subEndX - subCpX)) : 1;
        const sdy = ss < 0.99 ? (2 * (1 - ss) * (subCpY - brY) + 2 * ss * (subEndY - subCpY)) : 0;
        const slen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
        const spx = -sdy / slen, spy = sdx / slen;
        sLeftPts.push({ x: sx - spx * sw / 2, y: sy - spy * sw / 2 });
        sRightPts.push({ x: sx + spx * sw / 2, y: sy + spy * sw / 2 });
      }
      let sd = `M ${sLeftPts[0].x} ${sLeftPts[0].y}`;
      for (let j = 1; j < sLeftPts.length; j++) sd += ` L ${sLeftPts[j].x} ${sLeftPts[j].y}`;
      sd += ` L ${sRightPts[sRightPts.length - 1].x} ${sRightPts[sRightPts.length - 1].y}`;
      for (let j = sRightPts.length - 2; j >= 0; j--) sd += ` L ${sRightPts[j].x} ${sRightPts[j].y}`;
      sd += ' Z';
      roots.push(sd);
    }
  }
  return roots;
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
