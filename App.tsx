// App.tsx — Family Tree: Professional quality
import React, { useMemo, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { View, Dimensions, StyleSheet, Text as RNText, ScrollView } from "react-native";
import {
  Canvas, Path, Skia, Group, Circle, RoundedRect, Oval,
  LinearGradient, vec, Paragraph,
} from "@shopify/react-native-skia";
import type { SkParagraphStyle, SkTextStyle } from "@shopify/react-native-skia";
import { TextAlign } from "@shopify/react-native-skia";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useDerivedValue, withDecay,
  withRepeat, withTiming, withSequence, withDelay,
  Easing,
} from "react-native-reanimated";

// ======================== ERROR BOUNDARY ========================
interface EBState { error: Error | null; info: ErrorInfo | null; }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error("ErrorBoundary caught:", error.message);
    console.error("Component stack:", info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: "#1a1a2e", padding: 20, paddingTop: 60 }}>
          <RNText style={{ color: "#e94560", fontSize: 18, fontWeight: "700" }}>Something went wrong</RNText>
          <RNText style={{ color: "#e94560", fontSize: 14, marginTop: 8 }}>{this.state.error.message}</RNText>
          <ScrollView style={{ marginTop: 16, flex: 1 }}>
            {this.state.info?.componentStack && (
              <>
                <RNText style={{ color: "#eee", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>Component Stack:</RNText>
                <RNText style={{ color: "#aaa", fontSize: 11, fontFamily: "monospace" }}>{this.state.info.componentStack}</RNText>
              </>
            )}
            {this.state.error.stack && (
              <>
                <RNText style={{ color: "#eee", fontSize: 12, fontWeight: "600", marginTop: 12, marginBottom: 4 }}>Stack Trace:</RNText>
                <RNText style={{ color: "#aaa", fontSize: 11, fontFamily: "monospace" }}>{this.state.error.stack}</RNText>
              </>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const { width: SW, height: SH } = Dimensions.get("window");

const NODE_R = 28;
const GEN_H = 200;

// ======================== REFINED PALETTE ========================
const P = {
  // Bark - warm browns with depth
  bark: {
    deep: "#1C0F05", shadow: "#2E1B0E", dark: "#3E2723",
    mid: "#5D4037", light: "#795548", highlight: "#A1887F",
    edge: "#4A3728",
  },
  // Leaves - natural greens with variety
  leaf: {
    deep: "#1B5E20", darkA: "#2E7D32", darkB: "#33691E",
    midA: "#388E3C", midB: "#43A047", midC: "#558B2F",
    lightA: "#66BB6A", lightB: "#7CB342", lightC: "#81C784",
    bright: "#8BC34A", highlight: "#AED581",
  },
  moss: ["#6B8E23", "#556B2F", "#7B9F35", "#8FBC8F"],
  // UI
  cream: "#fdf6e3", parch: "#f4e8c1", parchDk: "#e6d5a8", parchEdge: "#d4c08f",
  ink: "#3b2a1a", inkFade: "#8b7a6a",
  sepia: "#8b6914", sepiaLt: "#c4a035", red: "#8b3a2a",
  // Animals
  owl: { body: "#7B6B5A", bodyDk: "#5C4D3C", breast: "#C4B098", face: "#D4C4A8", eye: "#F5C518", eyeRing: "#E8B50A", pupil: "#1A1A1A", beak: "#C49A2A", feet: "#9E8E6E" },
  bird: { body: "#C75B4A", bodyDk: "#A04535", breast: "#E8A870", wing: "#8B4535", wingDk: "#6B3025", tail: "#7B3B2B", beak: "#E8B040", eye: "#1A1A1A" },
  squirrel: { body: "#A0622A", bodyDk: "#7A4A1E", belly: "#D4A860", tail: "#8B5220", tailLight: "#C08040", ear: "#C48838", nose: "#2A1A0A", eye: "#1A1A1A" },
};

const LEAF_COLS = [P.leaf.deep, P.leaf.darkA, P.leaf.darkB, P.leaf.midA, P.leaf.midB, P.leaf.midC, P.leaf.lightA, P.leaf.lightB, P.leaf.lightC, P.leaf.bright];

// ======================== UTILS ========================
function sr(seed: number) {
  let s = seed || 42;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function pick<T>(a: T[], r: () => number): T { return a[Math.floor(r() * a.length)]; }
function hsh(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h) || 42; }

// ======================== DATA (flat relational tables) ========================
interface PersonRow {
  id: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female";
  birth_date: string | null;
  death_date: string | null;
  notes: string | null;
}
interface ParentChildRow { parent_id: string; child_id: string; }
interface MarriageRow { spouse1_id: string; spouse2_id: string; marriage_date: string | null; divorce_date: string | null; }

interface FamilyDB {
  people: PersonRow[];
  parent_child_relationships: ParentChildRow[];
  marriages: MarriageRow[];
}

const DB: FamilyDB = {
  people: [
    { id: "jan",    first_name: "Jan",    last_name: "Kowalski", gender: "male",   birth_date: "1965", death_date: null, notes: null },
    { id: "anna",   first_name: "Anna",   last_name: "Kowalska", gender: "female", birth_date: "1968", death_date: null, notes: null },
    { id: "piotr",  first_name: "Piotr",  last_name: "Kowalski", gender: "male",   birth_date: "1992", death_date: null, notes: null },
    { id: "ewa",    first_name: "Ewa",    last_name: "Kowalska", gender: "female", birth_date: "1993", death_date: null, notes: null },
    { id: "kacper", first_name: "Kacper", last_name: "Kowalski", gender: "male",   birth_date: "2018", death_date: null, notes: null },
    { id: "zofia",  first_name: "Zofia",  last_name: "Kowalska", gender: "female", birth_date: "2020", death_date: null, notes: null },
    { id: "maria",  first_name: "Maria",  last_name: "Nowak",    gender: "female", birth_date: "1995", death_date: null, notes: null },
    { id: "tomek",  first_name: "Tomek",  last_name: "Nowak",    gender: "male",   birth_date: "1992", death_date: null, notes: null },
    { id: "alicja", first_name: "Alicja", last_name: "Nowak",    gender: "female", birth_date: "2019", death_date: null, notes: null },
    { id: "filip",  first_name: "Filip",  last_name: "Nowak",    gender: "male",   birth_date: "2021", death_date: null, notes: null },
    { id: "hanna",  first_name: "Hanna",  last_name: "Nowak",    gender: "female", birth_date: "2023", death_date: null, notes: null },
    { id: "jakub",  first_name: "Jakub",  last_name: "Nowak",    gender: "male",   birth_date: "2025", death_date: null, notes: null },
    { id: "oliwia", first_name: "Oliwia", last_name: "Nowak",    gender: "female", birth_date: "2027", death_date: null, notes: null },
    { id: "szymon", first_name: "Szymon", last_name: "Nowak",    gender: "male",   birth_date: "2029", death_date: null, notes: null },
    { id: "maja",   first_name: "Maja",   last_name: "Nowak",    gender: "female", birth_date: "2031", death_date: null, notes: null },
  ],
  parent_child_relationships: [
    { parent_id: "jan",   child_id: "piotr"  },
    { parent_id: "anna",  child_id: "piotr"  },
    { parent_id: "jan",   child_id: "maria"  },
    { parent_id: "anna",  child_id: "maria"  },
    { parent_id: "piotr", child_id: "kacper" },
    { parent_id: "ewa",   child_id: "kacper" },
    { parent_id: "piotr", child_id: "zofia"  },
    { parent_id: "ewa",   child_id: "zofia"  },
    { parent_id: "maria", child_id: "alicja" },
    { parent_id: "tomek", child_id: "alicja" },
    { parent_id: "maria", child_id: "filip"  },
    { parent_id: "tomek", child_id: "filip"  },
    { parent_id: "maria", child_id: "hanna"  },
    { parent_id: "tomek", child_id: "hanna"  },
    { parent_id: "maria", child_id: "jakub"  },
    { parent_id: "tomek", child_id: "jakub"  },
    { parent_id: "maria", child_id: "oliwia" },
    { parent_id: "tomek", child_id: "oliwia" },
    { parent_id: "maria", child_id: "szymon" },
    { parent_id: "tomek", child_id: "szymon" },
    { parent_id: "maria", child_id: "maja"   },
    { parent_id: "tomek", child_id: "maja"   },
  ],
  marriages: [
    { spouse1_id: "jan",   spouse2_id: "anna",  marriage_date: "1990", divorce_date: null },
    { spouse1_id: "piotr", spouse2_id: "ewa",   marriage_date: "2016", divorce_date: null },
    { spouse1_id: "tomek", spouse2_id: "maria", marriage_date: "2018", divorce_date: null },
  ],
};

// ======================== DB → TREE BUILDER ========================
interface Person {
  id: string; name: string; born: string;
  partners?: { person: Person; children?: Person[] }[];
}

function buildTree(db: FamilyDB, rootId: string): Person {
  const pMap = new Map(db.people.map(p => [p.id, p]));

  // Find spouse for a person
  function getSpouse(id: string): string | null {
    const m = db.marriages.find(m => m.spouse1_id === id || m.spouse2_id === id);
    if (!m) return null;
    return m.spouse1_id === id ? m.spouse2_id : m.spouse1_id;
  }

  // Find children of a couple (both parents must match)
  function getChildren(p1: string, p2: string): string[] {
    const p1Kids = new Set(db.parent_child_relationships.filter(r => r.parent_id === p1).map(r => r.child_id));
    const p2Kids = new Set(db.parent_child_relationships.filter(r => r.parent_id === p2).map(r => r.child_id));
    return [...p1Kids].filter(id => p2Kids.has(id));
  }

  // Find children of a single parent (no spouse)
  function getSoloChildren(pid: string): string[] {
    return db.parent_child_relationships.filter(r => r.parent_id === pid).map(r => r.child_id);
  }

  const visited = new Set<string>();

  function build(id: string): Person {
    visited.add(id);
    const row = pMap.get(id)!;
    const p: Person = { id: row.id, name: `${row.first_name} ${row.last_name}`, born: row.birth_date || "" };

    const spouseId = getSpouse(id);
    if (spouseId && !visited.has(spouseId)) {
      visited.add(spouseId);
      const sp = pMap.get(spouseId)!;
      const childIds = getChildren(id, spouseId);
      const children = childIds.map(cid => build(cid));
      p.partners = [{
        person: { id: sp.id, name: `${sp.first_name} ${sp.last_name}`, born: sp.birth_date || "" },
        children: children.length > 0 ? children : undefined,
      }];
    } else if (!spouseId) {
      // Single parent case
      const childIds = getSoloChildren(id);
      if (childIds.length > 0) {
        // No partner node, just attach children directly — not supported by current layout
        // so we skip for now
      }
    }

    return p;
  }

  return build(rootId);
}

const TREE = buildTree(DB, "jan");

// ======================== LAYOUT ========================
interface LNode { id: string; name: string; born: string; x: number; y: number; depth: number; partnerId?: string; }
interface Conn { x1: number; y1: number; x2: number; y2: number; type: "couple"|"trunk"|"branch"; seed: number; depth: number; }

function layoutTree(tree: Person) {
  const nodes: LNode[] = [], conns: Conn[] = [];
  function subW(p: Person): number {
    const kids = p.partners?.flatMap(pt => pt.children || []) || [];
    const myW = p.partners?.length ? 160 : 80;
    if (!kids.length) return myW;
    return Math.max(myW, kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? 40 : 0), 0));
  }
  function place(p: Person, cx: number, y: number, d: number) {
    const hp = p.partners && p.partners.length > 0;
    const px = hp ? cx - 40 : cx;
    nodes.push({ id: p.id, name: p.name, born: p.born, x: px, y, depth: d });
    if (hp) {
      const pt = p.partners![0].person, ptx = cx + 40;
      nodes.push({ id: pt.id, name: pt.name, born: pt.born, x: ptx, y, depth: d, partnerId: p.id });
      conns.push({ x1: px, y1: y, x2: ptx, y2: y, type: "couple", seed: hsh(p.id + pt.id), depth: d });
      const kids = p.partners![0].children || [];
      if (kids.length) {
        const trunkLen = d === 0 ? 120 : 60;
        const mid = (px + ptx) / 2, ty2 = y + NODE_R + trunkLen;
        conns.push({ x1: mid, y1: y + NODE_R + 4, x2: mid, y2: ty2, type: "trunk", seed: hsh(p.id + "t"), depth: d });
        const tw = kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? 40 : 0), 0);
        let cl = mid - tw / 2;
        kids.forEach(ch => {
          const cw = subW(ch), cc = cl + cw / 2;
          const genH = d === 0 ? GEN_H + 60 : GEN_H;
          conns.push({ x1: mid, y1: ty2, x2: cc, y2: y + genH - NODE_R - 4, type: "branch", seed: hsh(ch.id), depth: d + 1 });
          place(ch, cc, y + genH, d + 1);
          cl += cw + 40;
        });
      }
    }
  }
  place(tree, subW(tree) / 2 + 50, 80, 0);
  let mn = Infinity; nodes.forEach(n => { if (n.x < mn) mn = n.x; });
  const sh = 60 - mn; nodes.forEach(n => n.x += sh); conns.forEach(c => { c.x1 += sh; c.x2 += sh; });
  return { nodes, conns };
}

// ======================== TRUNK GENERATION ========================
function genTrunk(x: number, y1: number, y2: number, bw: number, seed: number) {
  const r = sr(seed), sg = 28;
  const ctr: {x:number;y:number;w:number}[] = [];
  for (let i = 0; i <= sg; i++) {
    const t = i / sg, y = lerp(y1, y2, t);
    const rootFlare = t > 0.85 ? 1 + Math.pow((t - 0.85) / 0.15, 0.6) * 0.8 : 1;
    const taper = Math.pow(1 - t, 0.25) * 1.15;
    const waist = 1 - Math.sin(t * Math.PI) * 0.04;
    const topSpread = t < 0.15 ? 1 + (1 - t / 0.15) * 0.3 : 1;
    const bump1 = Math.sin(t * Math.PI * 5.7 + r() * 2) * 1.2 * (r() - 0.3);
    const bump2 = Math.sin(t * Math.PI * 3.1 + r() * 3) * 0.8 * (r() - 0.4);
    const w = bw * taper * waist * rootFlare * topSpread + bump1 + bump2;
    const drift = Math.sin(t * Math.PI * 1.3) * 1.8 + (r() - 0.5) * 1;
    ctr.push({ x: x + drift, y, w });
  }

  let path = `M ${ctr[0].x - ctr[0].w/2} ${ctr[0].y}`;
  for (let i = 1; i <= sg; i++) {
    const px = ctr[i].x - ctr[i].w/2;
    const ppx = ctr[i-1].x - ctr[i-1].w/2;
    const cpx = (ppx + px) / 2 + (r() - 0.5) * 1;
    path += ` Q ${cpx} ${(ctr[i-1].y + ctr[i].y) / 2}, ${px} ${ctr[i].y}`;
  }
  for (let i = sg; i >= 0; i--) {
    const px = ctr[i].x + ctr[i].w/2;
    if (i === sg) path += ` L ${px} ${ctr[i].y}`;
    else {
      const npx = ctr[i+1].x + ctr[i+1].w/2;
      const cpx = (npx + px) / 2 + (r() - 0.5) * 1;
      path += ` Q ${cpx} ${(ctr[i+1].y + ctr[i].y) / 2}, ${px} ${ctr[i].y}`;
    }
  }
  path += " Z";

  // Vertical furrows
  const furrows: {d:string;w:number;op:number;dark:boolean}[] = [];
  for (let i = 0; i < 16; i++) {
    const xRatio = (r() - 0.5) * 0.7;
    const t1 = r() * 0.3, t2 = t1 + 0.15 + r() * 0.5;
    let d = "";
    for (let j = 0; j <= 8; j++) {
      const t = lerp(t1, t2, j / 8), idx = Math.min(Math.floor(t * sg), sg);
      const px = ctr[idx].x + xRatio * ctr[idx].w + Math.sin(j * 1.3 + r() * 5) * 0.8;
      d += j === 0 ? `M ${px} ${ctr[idx].y}` : ` L ${px} ${ctr[idx].y}`;
    }
    furrows.push({ d, w: 0.3 + r() * 1.1, op: 0.1 + r() * 0.18, dark: r() > 0.4 });
  }

  // Horizontal bark cracks
  const cracks: {d:string;w:number;op:number}[] = [];
  for (let i = 0; i < 8; i++) {
    const t = 0.08 + r() * 0.84, idx = Math.min(Math.floor(t * sg), sg);
    const cy = ctr[idx].y, hw = ctr[idx].w * (0.15 + r() * 0.4);
    const cx = ctr[idx].x + (r() - 0.5) * ctr[idx].w * 0.2;
    cracks.push({
      d: `M ${cx - hw} ${cy + (r()-0.5)*2} L ${cx} ${cy + (r()-0.5)*2} L ${cx + hw} ${cy + (r()-0.5)*2}`,
      w: 0.2 + r() * 0.5, op: 0.06 + r() * 0.08,
    });
  }

  // Highlight streaks
  const highlights: {d:string;w:number;op:number}[] = [];
  for (let i = 0; i < 3; i++) {
    const t1 = 0.05 + r() * 0.3, t2 = t1 + 0.15 + r() * 0.3;
    const xRatio = 0.15 + r() * 0.15;
    let d = "";
    for (let j = 0; j <= 5; j++) {
      const t = lerp(t1, t2, j / 5), idx = Math.min(Math.floor(t * sg), sg);
      const px = ctr[idx].x + xRatio * ctr[idx].w + (r() - 0.5) * 1;
      d += j === 0 ? `M ${px} ${ctr[idx].y}` : ` L ${px} ${ctr[idx].y}`;
    }
    highlights.push({ d, w: 1 + r() * 2, op: 0.04 + r() * 0.04 });
  }

  const knots = Array.from({length: 3}, () => {
    const t = 0.15 + r() * 0.6, idx = Math.min(Math.floor(t * sg), sg);
    return { cx: ctr[idx].x + (r()-0.5) * ctr[idx].w * 0.35, cy: ctr[idx].y,
      rx: 2 + r() * 3, ry: 1.5 + r() * 2.5, op: 0.2 + r() * 0.15, hasRing: r() > 0.3 };
  });

  const moss = Array.from({length: 5}, () => {
    const t = 0.15 + r() * 0.55, idx = Math.min(Math.floor(t * sg), sg);
    const side = r() > 0.5 ? 1 : -1;
    return { cx: ctr[idx].x + side * ctr[idx].w * 0.35, cy: ctr[idx].y,
      rx: 2.5 + r() * 4.5, ry: 1.5 + r() * 3, col: pick(P.moss, r), op: 0.15 + r() * 0.2 };
  });

  const roots: {d:string;w:number;op:number}[] = [];
  for (let i = 0; i < 12; i++) {
    const side = i < 6 ? -1 : 1;
    const sx = x + side * (bw * 0.1 + r() * bw * 0.35), sy = y2 - 2 + r() * 5;
    const ex = sx + side * (12 + r() * 30), ey = sy + 6 + r() * 18;
    roots.push({ d: `M ${sx} ${sy} Q ${sx + side * (6 + r() * 14)} ${sy + 3 + r() * 10}, ${ex} ${ey}`, w: 2 + r() * 5, op: 0.35 + r() * 0.35 });
    if (r() > 0.4) {
      const ex2 = ex + side * (5 + r() * 12), ey2 = ey + 3 + r() * 8;
      roots.push({ d: `M ${ex} ${ey} L ${ex2} ${ey2}`, w: 0.6 + r() * 1.5, op: 0.2 + r() * 0.25 });
    }
  }

  // Store width info for gradient positioning
  const midW = ctr[Math.floor(sg/2)].w;

  return { path, furrows, cracks, highlights, knots, moss, roots, midW };
}

// ======================== BRANCH GENERATION ========================
function genBranch(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const r = sr(seed), sg = 18;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const thick = Math.max(4, 12 - len / 40);
  const ang = Math.atan2(dy, dx), pA = ang + Math.PI / 2;

  const pts: {x:number;y:number;w:number}[] = [];
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
    const mx = (lPts[i-1].x + lPts[i].x) / 2, my = (lPts[i-1].y + lPts[i].y) / 2;
    path += ` Q ${lPts[i-1].x} ${lPts[i-1].y} ${mx} ${my}`;
  }
  path += ` L ${lPts[sg].x} ${lPts[sg].y}`;
  for (let i = rPts.length - 1; i >= 0; i--) {
    if (i === rPts.length - 1) path += ` L ${rPts[i].x} ${rPts[i].y}`;
    else {
      const mx = (rPts[i+1].x + rPts[i].x) / 2, my = (rPts[i+1].y + rPts[i].y) / 2;
      path += ` Q ${rPts[i+1].x} ${rPts[i+1].y} ${mx} ${my}`;
    }
  }
  path += " Z";

  // Bark texture
  const barkLines: {d:string;w:number;op:number}[] = [];
  for (let i = 0; i < 10; i++) {
    const t1 = r() * 0.35, t2 = t1 + 0.1 + r() * 0.4;
    const offRatio = (r() - 0.5) * 0.5;
    let d = "";
    for (let j = 0; j <= 6; j++) {
      const t = lerp(t1, t2, j / 6), idx = Math.min(Math.floor(t * sg), sg);
      const px = pts[idx].x + offRatio * pts[idx].w + (r()-0.5) * 0.8;
      d += j === 0 ? `M ${px} ${pts[idx].y}` : ` L ${px} ${pts[idx].y}`;
    }
    barkLines.push({ d, w: 0.2 + r() * 0.6, op: 0.06 + r() * 0.1 });
  }

  // Twigs — shorter, fewer, closer angles to branch direction
  const twigs: {d:string;w:number}[] = [];
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
      twigs.push({ d: `M ${ex} ${ey} Q ${(ex+sex)/2 + (r()-0.5)} ${(ey+sey)/2 + (r()-0.5)}, ${sex} ${sey}`, w: tipW * 0.5 });
    }
  }

  return { path, barkLines, twigs };
}

// ======================== LEAF SYSTEM ========================
interface LeafD { x: number; y: number; sz: number; rot: number; col: string; type: number; op: number; layer: number; }

function genCanopy(cx: number, cy: number, rx: number, ry: number, count: number, seed: number): LeafD[] {
  const r = sr(seed);
  const leaves: LeafD[] = [];
  // 3 layers: back (darker, bigger), mid, front (brighter, smaller)
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

// Safe path creator — converts string to SkPath, returns empty path on failure
function mkPath(d: string) {
  try {
    const p = Skia.Path.MakeFromSVGString(d);
    return p || Skia.Path.Make();
  } catch { return Skia.Path.Make(); }
}

function leafPath(sz: number, type: number) {
  const w = sz * 0.42;
  if (type === 0) return mkPath(`M 0,0 C ${-w},${-sz*0.25} ${-w*0.9},${-sz*0.65} ${-w*0.12},${-sz*0.92} Q 0,${-sz*1.06} ${w*0.12},${-sz*0.92} C ${w*0.9},${-sz*0.65} ${w},${-sz*0.25} 0,0 Z`);
  if (type === 1) return mkPath(`M 0,0 C ${-w*1.15},${-sz*0.32} ${-w*0.8},${-sz*0.78} 0,${-sz} C ${w*0.8},${-sz*0.78} ${w*1.15},${-sz*0.32} 0,0 Z`);
  return mkPath(`M 0,0 C ${-w*1.25},${-sz*0.38} ${-w*0.65},${-sz*0.82} 0,${-sz} C ${w*0.65},${-sz*0.82} ${w*1.25},${-sz*0.38} 0,0 Z`);
}

function leafVein(sz: number) { return mkPath(`M 0,${-sz*0.08} L 0,${-sz*0.82}`); }

// ======================== ANIMALS (Composed shapes) ========================
interface AnimalD { type: "owl"|"bird"|"squirrel"; x: number; y: number; flip: boolean; seed: number; }

function placeAnimals(conns: Conn[]): AnimalD[] {
  const a: AnimalD[] = [];
  const br = conns.filter(c => c.type === "branch");
  const tr = conns.filter(c => c.type === "trunk");
  const r = sr(br.length * 7 + 42);
  const types: AnimalD["type"][] = ["bird", "squirrel", "bird"];
  // Owl always on trunk
  if (tr.length > 0) a.push({ type: "owl", x: tr[0].x1 + 16, y: (tr[0].y1 + tr[0].y2) / 2 + 40, flip: false, seed: tr[0].seed });
  // Randomly place animals on ~60% of branches
  for (let i = 0; i < br.length; i++) {
    if (r() > 0.6) continue;
    const b = br[i];
    const t = 0.35 + r() * 0.3; // position along branch (35-65%)
    const type = types[Math.floor(r() * types.length)];
    const yOff = type === "squirrel" ? -11 : -9;
    a.push({
      type,
      x: lerp(b.x1, b.x2, t),
      y: lerp(b.y1, b.y2, t) + yOff,
      flip: r() > 0.5,
      seed: b.seed + i * 13,
    });
  }
  return a;
}

// Owl: based on SVG reference, scaled 0.3x centered at origin. scaleX flips.
function OwlComponent({ x, y, flip, eyeScale }: { x: number; y: number; flip: boolean; eyeScale: any }) {
  const s = flip ? -1 : 1;
  // Colors from SVG reference
  const C = { body: "#8B4513", bodyDk: "#6B3410", face: "#D2691E", gold: "#FFD700", white: "#FFF", black: "#000" };
  const paths = useMemo(() => ({
    earL: mkPath("M -10.5,-16.5 L -9,-21 L -7.5,-16.5 Z"),
    earR: mkPath("M 7.5,-16.5 L 9,-21 L 10.5,-16.5 Z"),
    beak: mkPath("M 0,-6 L -1.5,-3 L 0,-1.5 L 1.5,-3 Z"),
    wingFeatherL1: mkPath("M -10.5,4.5 Q -13.5,7.5 -10.5,10.5"),
    wingFeatherL2: mkPath("M -10.5,7.5 Q -13.5,10.5 -10.5,13.5"),
    wingFeatherR1: mkPath("M 10.5,4.5 Q 13.5,7.5 10.5,10.5"),
    wingFeatherR2: mkPath("M 10.5,7.5 Q 13.5,10.5 10.5,13.5"),
    talonsL: mkPath("M -5.4,23.1 L -6,24.9 M -4.5,23.4 L -4.5,25.5 M -3.6,23.1 L -3,24.9"),
    talonsR: mkPath("M 3.6,23.1 L 3,24.9 M 4.5,23.4 L 4.5,25.5 M 5.4,23.1 L 6,24.9"),
  }), []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scaleX: s }]}>
      {/* Body */}
      <Oval x={-15} y={-13.5} width={30} height={36} color={C.body} />
      {/* Head */}
      <Circle cx={0} cy={-7.5} r={13.5} color={C.body} />
      {/* Ear tufts */}
      <Path path={paths.earL} color={C.bodyDk} />
      <Path path={paths.earR} color={C.bodyDk} />
      {/* Face disk */}
      <Circle cx={0} cy={-7.5} r={10.5} color={C.face} />
      {/* Eyes — animated blink via eyeScale */}
      <Group transform={eyeScale} origin={vec(-4.5, -9)}>
        <Circle cx={-4.5} cy={-9} r={4.5} color={C.white} />
        <Circle cx={-4.5} cy={-9} r={2.4} color={C.black} />
        <Circle cx={-3.9} cy={-9.9} r={0.9} color={C.white} />
      </Group>
      <Group transform={eyeScale} origin={vec(4.5, -9)}>
        <Circle cx={4.5} cy={-9} r={4.5} color={C.white} />
        <Circle cx={4.5} cy={-9} r={2.4} color={C.black} />
        <Circle cx={5.1} cy={-9.9} r={0.9} color={C.white} />
      </Group>
      {/* Beak */}
      <Path path={paths.beak} color={C.gold} />
      {/* Wings */}
      <Oval x={-16.5} y={-3} width={12} height={21} color={C.bodyDk} />
      <Oval x={4.5} y={-3} width={12} height={21} color={C.bodyDk} />
      {/* Wing feather details */}
      <Path path={paths.wingFeatherL1} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherL2} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherR1} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherR2} style="stroke" color={C.body} strokeWidth={0.6} />
      {/* Belly feathers */}
      <Oval x={-7.5} y={0} width={15} height={18} color={C.face} />
      {/* Feet */}
      <Oval x={-6.9} y={17.4} width={4.8} height={7.2} color={C.gold} />
      <Oval x={2.1} y={17.4} width={4.8} height={7.2} color={C.gold} />
      {/* Talons */}
      <Path path={paths.talonsL} style="stroke" color={C.bodyDk} strokeWidth={0.6} strokeCap="round" />
      <Path path={paths.talonsR} style="stroke" color={C.bodyDk} strokeWidth={0.6} strokeCap="round" />
    </Group>
  );
}

// Bird: clean robin-like shape — all paths defined facing right, scaleX flips
function BirdComponent({ x, y, flip, bobTransform }: { x: number; y: number; flip: boolean; bobTransform: any }) {
  const s = flip ? -1 : 1;
  const B = P.bird;
  const paths = useMemo(() => ({
    tail: mkPath("M -5,4 L -14,1 L -13,5 L -12,2 L -11,6 L -5,5 Z"),
    body: mkPath("M 0,0 C -5,-1 -7,2 -6,7 C -5,9 -2,10 0,10 C 2,10 5,9 6,7 C 7,2 5,-1 0,0 Z"),
    belly: mkPath("M -3,5 C -3,7 0,9 3,5 Z"),
    wing: mkPath("M -3,1 Q 0,-2 5,0 Q 6,3 4,6 Q 1,8 -2,5 Z"),
    beak: mkPath("M 6,3 L 10,3.5 L 6,5"),
    wingLine1: mkPath("M -1,2 Q 1,0 4,1.5"),
    wingLine2: mkPath("M -1,3.5 Q 1.5,2 5,3"),
    legsL: mkPath("M 0,9 L -1,13 L -2.5,13.5 M -1,13 L 0.5,13.5"),
    legsR: mkPath("M 3,9 L 4,13 L 2.5,13.5 M 4,13 L 5.5,13.5"),
  }), []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scaleX: s }]}>
      <Group transform={bobTransform}>
        <Path path={paths.tail} color={B.tail} />
        <Oval x={-6.5} y={0.5} width={14} height={11} color="rgba(0,0,0,0.07)" />
        <Path path={paths.body} color={B.body} />
        <Path path={paths.belly} color={B.breast} opacity={0.75} />
        <Path path={paths.wing} color={B.wing} opacity={0.7} />
        <Path path={paths.wingLine1} style="stroke" color={B.wingDk} strokeWidth={0.3} opacity={0.3} />
        <Path path={paths.wingLine2} style="stroke" color={B.wingDk} strokeWidth={0.3} opacity={0.2} />
        <Circle cx={6} cy={1} r={4} color={B.body} />
        <Circle cx={7.5} cy={0.5} r={1.5} color="white" />
        <Circle cx={7.8} cy={0.5} r={1} color={B.eye} />
        <Circle cx={8.1} cy={0} r={0.35} color="white" opacity={0.8} />
        <Path path={paths.beak} color={B.beak} />
        <Path path={paths.legsL} style="stroke" color={B.bodyDk} strokeWidth={0.6} strokeCap="round" />
        <Path path={paths.legsR} style="stroke" color={B.bodyDk} strokeWidth={0.6} strokeCap="round" />
      </Group>
    </Group>
  );
}

// Squirrel: cute composed shape — all paths defined facing right, scaleX flips
function SquirrelComponent({ x, y, flip, tailTransform }: { x: number; y: number; flip: boolean; tailTransform: any }) {
  const s = flip ? -1 : 1;
  const S = P.squirrel;
  const paths = useMemo(() => ({
    tail: mkPath("M -3,6 C -10,3 -15,-5 -10,-12 C -7,-16 -2,-14 -1,-9 C 0,-5 -1,0 -3,4 Z"),
    tailLight: mkPath("M -3,5 C -9,2 -13,-4 -9,-10 C -7,-14 -3,-12 -2,-8 C -1,-4 -1,1 -3,4 Z"),
    tailFur1: mkPath("M -5,2 Q -8,-2 -8,-6"),
    tailFur2: mkPath("M -4,0 Q -6,-4 -5,-9"),
    body: mkPath("M 0,2 C -5,0 -7,4 -6,12 C -5,15 -2,16 0,16 C 2,16 5,15 6,12 C 7,4 5,0 0,2 Z"),
    belly: mkPath("M -3.5,7 C -3.5,11 0,14 3.5,7 Z"),
    bellyLine1: mkPath("M -1,5 Q 1,6 3,5"),
    bellyLine2: mkPath("M -1.5,8 Q 1,9 3.5,8"),
    paw: mkPath("M 3,7 Q 5,6 6,8 Q 5,9 3,9 Z"),
    head: mkPath("M 5,1 C 8,-2 10,-1 9,3 C 8,5 6,5 5,3 Z"),
    earL: mkPath("M 3,-7 L 2,-13 Q 4,-11 5,-7 Z"),
    earR: mkPath("M 9,-7 L 10,-13 Q 8,-11 7,-7 Z"),
    earInL: mkPath("M 3.5,-7 L 2.8,-11 Q 4,-10 4.5,-7 Z"),
    earInR: mkPath("M 8.5,-7 L 9.2,-11 Q 8,-10 7.5,-7 Z"),
    whiskers: mkPath("M 10.5,-2.5 L 14,-3.5 M 10.5,-2 L 14,-1.5 M 10.5,-1.5 L 13,0"),
    footL: mkPath("M -2,15 Q -4,16 -5,15.5 Q -4,17 -1,16.5 Z"),
    footR: mkPath("M 4,15 Q 6,16 7,15.5 Q 6,17 3,16.5 Z"),
  }), []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scaleX: s }]}>
      <Group transform={tailTransform} origin={vec(-3, 6)}>
        <Path path={paths.tail} color={S.tail} />
        <Path path={paths.tailLight} color={S.tailLight} opacity={0.4} />
        <Path path={paths.tailFur1} style="stroke" color={S.bodyDk} strokeWidth={0.3} opacity={0.15} />
        <Path path={paths.tailFur2} style="stroke" color={S.bodyDk} strokeWidth={0.3} opacity={0.12} />
      </Group>
      <Oval x={-5.5} y={0.5} width={13} height={17} color="rgba(0,0,0,0.07)" />
      <Path path={paths.body} color={S.body} />
      <Path path={paths.belly} color={S.belly} opacity={0.6} />
      <Path path={paths.bellyLine1} style="stroke" color={S.body} strokeWidth={0.3} opacity={0.2} />
      <Path path={paths.bellyLine2} style="stroke" color={S.body} strokeWidth={0.3} opacity={0.15} />
      <Path path={paths.paw} color={S.bodyDk} opacity={0.3} />
      <Oval x={1} y={-8} width={10} height={9} color={S.body} />
      <Path path={paths.earL} color={S.ear} />
      <Path path={paths.earR} color={S.ear} />
      <Path path={paths.earInL} color={S.belly} opacity={0.4} />
      <Path path={paths.earInR} color={S.belly} opacity={0.4} />
      <Circle cx={8} cy={-4.5} r={1.8} color="white" />
      <Circle cx={8.3} cy={-4.5} r={1.2} color={S.eye} />
      <Circle cx={8.7} cy={-5} r={0.4} color="white" opacity={0.85} />
      <Oval x={8.5} y={-4} width={2} height={1.4} color={S.nose} />
      <Path path={paths.whiskers} style="stroke" color={S.bodyDk} strokeWidth={0.2} opacity={0.2} />
      <Path path={paths.footL} color={S.bodyDk} opacity={0.4} />
      <Path path={paths.footR} color={S.bodyDk} opacity={0.4} />
    </Group>
  );
}

// ======================== PARAGRAPH ========================
function mkPara(text: string, sz: number, col: string, w: number, bold = false) {
  const s: SkParagraphStyle = { textAlign: TextAlign.Center };
  const ts: SkTextStyle = { fontSize: sz, fontFamilies: ["serif"], color: Skia.Color(col), fontStyle: bold ? { weight: 700 } : { weight: 400 } };
  const p = Skia.ParagraphBuilder.Make(s).pushStyle(ts).addText(text).pop().build();
  p.layout(w);
  return p;
}

// ======================== MAIN ========================
export default function App() {
  const layout = useMemo(() => layoutTree(TREE), []);

  const geo = useMemo(() => {
    const trunks = layout.conns.filter(c => c.type === "trunk").map(c => {
      const raw = genTrunk(c.x1, c.y1, c.y2, 48, c.seed);
      return {
        ...c, bw: 48, midW: raw.midW,
        path: mkPath(raw.path),
        furrows: raw.furrows.map(f => ({ ...f, path: mkPath(f.d) })),
        cracks: raw.cracks.map(cr => ({ ...cr, path: mkPath(cr.d) })),
        highlights: raw.highlights.map(h => ({ ...h, path: mkPath(h.d) })),
        knots: raw.knots, moss: raw.moss,
        roots: raw.roots.map(r => ({ ...r, path: mkPath(r.d) })),
        topLeaves: genCanopy(c.x1, c.y2 - 10, 28, 18, 30, c.seed + 7000),
      };
    });

    const branches = layout.conns.filter(c => c.type === "branch").map(c => {
      const raw = genBranch(c.x1, c.y1, c.x2, c.y2, c.seed);
      return {
        ...c,
        path: mkPath(raw.path),
        barkLines: raw.barkLines.map(bl => ({ ...bl, path: mkPath(bl.d) })),
        twigs: raw.twigs.map(tw => ({ ...tw, path: mkPath(tw.d) })),
        midLeaves: genCanopy((c.x1+c.x2)/2, (c.y1+c.y2)/2, 20, 14, 20, c.seed + 4000),
        tipLeaves: genCanopy(c.x2, c.y2 - 14, 18, 12, 18, c.seed + 5000),
      };
    });

    const couples = layout.conns.filter(c => c.type === "couple");
    const animals = placeAnimals(layout.conns);
    const labels = layout.nodes.map(n => ({
      id: n.id,
      name: mkPara(n.name.split(" ")[0], 10, P.ink, 80, true),
      born: mkPara(`ur. ${n.born}`, 8, P.inkFade, 80),
    }));
    return { trunks, branches, couples, animals, labels };
  }, [layout]);

  // === ANIMATIONS ===
  const windPhase = useSharedValue(0);
  useEffect(() => {
    windPhase.value = withRepeat(withTiming(Math.PI * 2, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const owlBlink = useSharedValue(1);
  useEffect(() => {
    owlBlink.value = withDelay(1500, withRepeat(
      withSequence(
        withTiming(0.05, { duration: 80 }),
        withTiming(1, { duration: 120 }),
        withDelay(3500, withTiming(1, { duration: 0 })),
      ), -1, false,
    ));
  }, []);

  const birdBob = useSharedValue(0);
  useEffect(() => {
    birdBob.value = withRepeat(withSequence(
      withTiming(-1.5, { duration: 250, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.5, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 150 }),
      withDelay(2000, withTiming(0, { duration: 0 })),
    ), -1, false);
  }, []);

  const tailWag = useSharedValue(0);
  useEffect(() => {
    tailWag.value = withRepeat(withTiming(0.12, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const leafSway = [
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value) * 0.03 }]),
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value + 1.2) * 0.04 }]),
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value + 2.4) * 0.035 }]),
  ];
  const owlEyeT = useDerivedValue(() => [{ scaleY: owlBlink.value }]);
  const birdBobT = useDerivedValue(() => [{ translateY: birdBob.value }]);
  const tailWagT = useDerivedValue(() => [{ rotate: tailWag.value }]);

  // === GESTURES ===
  const tx = useSharedValue(0), ty = useSharedValue(0), sc = useSharedValue(1);
  const stx = useSharedValue(0), sty = useSharedValue(0), ssc = useSharedValue(1);
  const fx = useSharedValue(0), fy = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => { stx.value = tx.value; sty.value = ty.value; })
    .onUpdate(e => { tx.value = stx.value + e.translationX; ty.value = sty.value + e.translationY; })
    .onEnd(e => { tx.value = withDecay({ velocity: e.velocityX, deceleration: 0.997 }); ty.value = withDecay({ velocity: e.velocityY, deceleration: 0.997 }); });

  const pinch = Gesture.Pinch()
    .onStart(e => { ssc.value = sc.value; fx.value = e.focalX; fy.value = e.focalY; })
    .onUpdate(e => {
      const nz = Math.min(4, Math.max(0.3, ssc.value * e.scale));
      const r = nz / sc.value;
      tx.value = fx.value - (fx.value - tx.value) * r;
      ty.value = fy.value - (fy.value - ty.value) * r;
      sc.value = nz;
    });

  const cam = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }]);

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={st.root}>
      <View style={st.hdr}>
        <RNText style={st.title}>✦ Drzewo Rodzinne ✦</RNText>
        <RNText style={st.sub}>Rodzina Kowalskich</RNText>
      </View>
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
        <View style={st.wrap}>
          <Canvas style={st.cvs}>
            <Group transform={cam}>

              {/* TRUNKS */}
              {geo.trunks.map((t, i) => (
                <Group key={`t${i}`}>
                  <Group transform={[{translateX:3},{translateY:4}]}>
                    <Path path={t.path} color="rgba(15,8,0,0.1)" />
                  </Group>
                  <Path path={t.path} style="fill">
                    <LinearGradient start={vec(t.x1-12, t.y1)} end={vec(t.x1+12, t.y1)} colors={[P.bark.light, P.bark.mid, P.bark.dark, P.bark.mid, P.bark.light]} />
                  </Path>
                  <Path path={t.path} style="fill" opacity={0.2}>
                    <LinearGradient start={vec(t.x1, t.y1)} end={vec(t.x1, t.y2)} colors={[P.bark.highlight, "transparent", P.bark.shadow]} />
                  </Path>
                  {t.furrows.map((f, fi) => <Path key={fi} path={f.path} style="stroke" color={P.bark.deep} strokeWidth={f.w} opacity={f.op} strokeCap="round" />)}
                  {t.highlights.map((h, hi) => <Path key={hi} path={h.path} style="stroke" color="rgba(255,255,240,0.06)" strokeWidth={h.w} opacity={h.op} strokeCap="round" />)}
                  {t.knots.map((k, ki) => (
                    <Group key={ki}>
                      <Oval x={k.cx-k.rx} y={k.cy-k.ry} width={k.rx*2} height={k.ry*2} color={P.bark.shadow} opacity={k.op} />
                      <Oval x={k.cx-k.rx*0.55} y={k.cy-k.ry*0.55} width={k.rx*1.1} height={k.ry*1.1} color={P.bark.deep} style="stroke" strokeWidth={0.3} opacity={k.op*0.5} />
                    </Group>
                  ))}
                  {t.moss.map((m, mi) => <Oval key={mi} x={m.cx-m.rx} y={m.cy-m.ry} width={m.rx*2} height={m.ry*2} color={m.col} opacity={m.op} />)}
                  {t.roots.map((r, ri) => <Path key={ri} path={r.path} style="stroke" color={P.bark.dark} strokeWidth={r.w} opacity={r.op} strokeCap="round" />)}
                  <Group transform={leafSway[i%3]} origin={vec(t.x1, t.y2-10)}>
                    {t.topLeaves.map((l, li) => (
                      <Group key={li} transform={[{translateX:l.x},{translateY:l.y},{rotate:(l.rot*Math.PI)/180}]}>
                        <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                        {l.layer > 0 && <Path path={leafVein(l.sz)} style="stroke" color={P.leaf.deep} strokeWidth={0.3} opacity={0.2} />}
                      </Group>
                    ))}
                  </Group>
                </Group>
              ))}

              {/* BRANCHES */}
              {geo.branches.map((b, i) => (
                <Group key={`b${i}`}>
                  <Group transform={[{translateX:2},{translateY:3}]}>
                    <Path path={b.path} color="rgba(15,8,0,0.07)" />
                  </Group>
                  <Path path={b.path} style="fill">
                    <LinearGradient start={vec(b.x1, b.y1)} end={vec(b.x2, b.y2)} colors={[P.bark.mid, P.bark.dark, P.bark.edge]} />
                  </Path>
                  {b.barkLines.map((bl, bi) => <Path key={bi} path={bl.path} style="stroke" color={P.bark.deep} strokeWidth={bl.w} opacity={bl.op} strokeCap="round" />)}
                  {b.twigs.map((tw, ti) => <Path key={ti} path={tw.path} style="stroke" color={P.bark.mid} strokeWidth={tw.w} opacity={0.4} strokeCap="round" />)}
                  <Group transform={leafSway[(i+1)%3]} origin={vec((b.x1+b.x2)/2, (b.y1+b.y2)/2)}>
                    {b.midLeaves.map((l, li) => (
                      <Group key={li} transform={[{translateX:l.x},{translateY:l.y},{rotate:(l.rot*Math.PI)/180}]}>
                        <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                        {l.layer > 0 && <Path path={leafVein(l.sz)} style="stroke" color={P.leaf.deep} strokeWidth={0.25} opacity={0.18} />}
                      </Group>
                    ))}
                  </Group>
                  <Group transform={leafSway[(i+2)%3]} origin={vec(b.x2, b.y2-14)}>
                    {b.tipLeaves.map((l, li) => (
                      <Group key={`tp${li}`} transform={[{translateX:l.x},{translateY:l.y},{rotate:(l.rot*Math.PI)/180}]}>
                        <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                      </Group>
                    ))}
                  </Group>
                </Group>
              ))}

              {/* ANIMALS */}
              {geo.animals.map((a, i) => {
                if (a.type === "owl") return <OwlComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} eyeScale={owlEyeT} />;
                if (a.type === "bird") return <BirdComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} bobTransform={birdBobT} />;
                if (a.type === "squirrel") return <SquirrelComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} tailTransform={tailWagT} />;
                return null;
              })}

              {/* COUPLES */}
              {geo.couples.map((c, i) => {
                const mx = (c.x1+c.x2)/2;
                const line1 = mkPath(`M ${c.x1+NODE_R},${c.y1} L ${c.x2-NODE_R},${c.y2}`);
                const line2 = mkPath(`M ${c.x1+NODE_R},${c.y1+3} L ${c.x2-NODE_R},${c.y2+3}`);
                return (
                  <Group key={`c${i}`}>
                    <Path path={line1} style="stroke" color={P.sepia} strokeWidth={1} />
                    <Path path={line2} style="stroke" color={P.sepia} strokeWidth={1} />
                    <Circle cx={mx} cy={c.y1} r={7} color={P.cream} />
                    <Circle cx={mx} cy={c.y1} r={7} color={P.red} style="stroke" strokeWidth={1} />
                  </Group>
                );
              })}

              {/* NODES */}
              {layout.nodes.map(n => {
                const lb = geo.labels.find(l => l.id === n.id);
                return (
                  <Group key={n.id}>
                    <Circle cx={n.x+1.5} cy={n.y+2.5} r={NODE_R} color="rgba(20,10,0,0.1)" />
                    <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.cream} />
                    <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.sepia} style="stroke" strokeWidth={1.5} />
                    <Circle cx={n.x} cy={n.y} r={NODE_R-3} color={P.parchDk} style="stroke" strokeWidth={0.4} opacity={0.4} />
                    <RoundedRect x={n.x-40} y={n.y+NODE_R+3} width={80} height={32} r={5} color={P.cream} />
                    <RoundedRect x={n.x-40} y={n.y+NODE_R+3} width={80} height={32} r={5} color={P.parchEdge} style="stroke" strokeWidth={0.6} />
                    {lb && <>
                      <Paragraph paragraph={lb.name} x={n.x-40} y={n.y+NODE_R+6} width={80} />
                      <Paragraph paragraph={lb.born} x={n.x-40} y={n.y+NODE_R+19} width={80} />
                    </>}
                  </Group>
                );
              })}

            </Group>
          </Canvas>
        </View>
      </GestureDetector>
      <View style={st.hint}><RNText style={st.hintTxt}>Przeciągnij • Pinch to zoom</RNText></View>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.parch },
  hdr: { paddingTop: 54, paddingBottom: 8, alignItems: "center", borderBottomWidth: 1, borderBottomColor: P.parchEdge, backgroundColor: P.cream },
  title: { fontFamily: "serif", fontSize: 18, fontWeight: "700", color: P.ink, letterSpacing: 1 },
  sub: { fontFamily: "serif", fontSize: 11, fontStyle: "italic", color: P.inkFade, marginTop: 2 },
  wrap: { flex: 1 },
  cvs: { flex: 1 },
  hint: { position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" },
  hintTxt: { fontFamily: "serif", fontSize: 11, fontStyle: "italic", color: P.inkFade, opacity: 0.6 },
});
