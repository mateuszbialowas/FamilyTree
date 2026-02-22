import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Canvas, Path, Group, Circle, RoundedRect, Oval,
  LinearGradient, vec, Paragraph,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue, useDerivedValue, withDecay,
  withRepeat, withTiming, withSequence, withDelay,
  Easing, runOnJS,
} from 'react-native-reanimated';
import type { FamilyState } from '../../types';
import {
  buildTree, buildAncestorTree, addAncestorCoupleConns, layoutTree, flipLayoutY,
  getTreePersonIds, hsh, NODE_R, GEN_H,
  COUPLE_SPACING, CHILD_GAP, COUPLE_WIDTH, SOLO_WIDTH, TRUNK_OFFSET, INITIAL_Y, MIN_EDGE_X,
} from '../../utils/treeLayout';
import type { TreeMode, LNode, Conn } from '../../utils/treeLayout';
import { P } from './palette';
import { mkPath } from './skiaHelpers';
import { mkPara } from './skiaHelpers';
import { genTrunk, genBranch, genCanopy, leafPath, leafVeinPath, placeAnimals, genRoots } from './geometry';
import { OwlComponent, BirdComponent, SquirrelComponent } from './animals';

// ======================== CANVAS CONSTANTS ========================

/** Base width for trunk geometry */
const TRUNK_BASE_WIDTH = 48;

/** Offset for shadow elements */
const SHADOW_OFFSET = { trunk: { x: 3, y: 4 }, branch: { x: 2, y: 3 }, root: { x: 2, y: 3 }, node: { x: 1.5, y: 2.5 } };

/** Node label box dimensions */
const LABEL_BOX = { width: 80, height: 44, radius: 5 };

/** Couple line visual constants */
const COUPLE_LINE = { offset: 3, circleR: 7 };

/** Node circle sizes */
const NODE_GLOW_R = NODE_R + 5;
const NODE_INNER_R = NODE_R - 3;

/** Stroke widths */
const STROKE = { rootRing: 2.5, nodeRing: 1.5, innerRing: 0.4, labelBox: 0.6, coupleLine: 1 };

/** Disconnected people layout */
const DISCONNECTED_GAP = 100;
const DISCONNECTED_MARGIN = 120;

/** Gesture zoom limits */
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 4;

/** Animation durations */
const ANIM = {
  wind: 5000,
  blinkDelay: 1500,
  blinkClose: 80,
  blinkOpen: 120,
  blinkInterval: 3500,
  bobUp: 250,
  bobDown: 200,
  bobSettle: 150,
  bobPause: 2000,
  tailWag: 700,
  centerDuration: 350,
  longPressDuration: 500,
};

// ======================== PROPS ========================
type Props = {
  state: FamilyState;
  rootId: string;
  mode: TreeMode;
  onNodePress: (personId: string) => void;
  onNodeLongPress: (personId: string) => void;
};

// ======================== MAIN COMPONENT ========================
export function FamilyTreeCanvas({ state, rootId, mode, onNodePress, onNodeLongPress }: Props) {
  const layout = useMemo(() => {
    let result: { nodes: LNode[]; conns: Conn[] };
    let inTree: Set<string>;

    if (mode === 'both') {
      // === Step 1: Build descendants from root (one trunk, normal layout) ===
      const descTree = buildTree(state, rootId);
      const desc = layoutTree(descTree);
      const allNodes: LNode[] = [...desc.nodes];
      const allConns: Conn[] = [...desc.conns];
      const placed = new Set(allNodes.map(n => n.id));
      const nodeMap = new Map<string, LNode>();
      allNodes.forEach(n => nodeMap.set(n.id, n));
      inTree = getTreePersonIds(descTree);

      const pMap = new Map(state.people.map(p => [p.id, p]));

      const spouseOf = (id: string): string | null => {
        const m = state.marriages.find(mg => mg.spouse1Id === id || mg.spouse2Id === id);
        return m ? (m.spouse1Id === id ? m.spouse2Id : m.spouse1Id) : null;
      };

      const parentsOf = (cid: string): string[] =>
        state.parentChildRelationships
          .filter(r => r.childId === cid)
          .map(r => r.parentId)
          .filter(pid => pMap.has(pid));

      const childrenOf = (...pids: string[]): string[] => {
        const s = new Set<string>();
        state.parentChildRelationships
          .filter(r => pids.includes(r.parentId))
          .forEach(r => s.add(r.childId));
        return [...s];
      };

      const mkNode = (id: string, x: number, y: number, depth: number, partnerId?: string): LNode => {
        const p = pMap.get(id)!;
        const node: LNode = { id, x, y, depth, name: `${p.firstName} ${p.lastName}`, born: p.birthDate || '' };
        if (partnerId) node.partnerId = partnerId;
        return node;
      };

      const addNode = (n: LNode) => {
        allNodes.push(n);
        nodeMap.set(n.id, n);
        placed.add(n.id);
        inTree.add(n.id);
      };

      // === Step 2: Walk up ancestors using only branches (no extra trunks) ===
      const doneGroups = new Set<string>();

      const findNeedingParents = (): string[] =>
        allNodes
          .filter(n => placed.has(n.id) && parentsOf(n.id).some(pid => !placed.has(pid)))
          .map(n => n.id);

      let queue = findNeedingParents();

      while (queue.length > 0) {
        const next: string[] = [];

        for (const personId of queue) {
          const pn = nodeMap.get(personId);
          if (!pn) continue;

          const ups = parentsOf(personId).filter(id => !placed.has(id));
          if (ups.length === 0) continue;

          // Determine parent couple
          const g1 = ups[0];
          const g1s = spouseOf(g1);
          const g2 = g1s && ups.includes(g1s) ? g1s : null;

          const gk = g2 ? [g1, g2].sort().join('+') : g1;
          if (doneGroups.has(gk)) continue;
          doneGroups.add(gk);

          // All children of these parents (discovers siblings)
          const allKids = childrenOf(...(g2 ? [g1, g2] : [g1]));
          const existingKids = allKids.filter(id => placed.has(id)).map(id => nodeMap.get(id)!);
          const newKids = allKids.filter(id => !placed.has(id));

          const childY = pn.y;
          const parentY = childY - GEN_H;

          // Place new siblings to the right of existing children
          let edge = -Infinity;
          for (const ck of existingKids) {
            edge = Math.max(edge, ck.x);
            const cs = spouseOf(ck.id);
            if (cs && nodeMap.has(cs)) edge = Math.max(edge, nodeMap.get(cs)!.x);
          }

          const sibNodes: LNode[] = [];
          let sx = edge + CHILD_GAP + COUPLE_SPACING * 2;

          for (const kid of newKids) {
            const ks = spouseOf(kid);
            if (ks && !placed.has(ks) && pMap.has(ks)) {
              // Sibling with spouse
              const sn = mkNode(kid, sx, childY, pn.depth);
              const spn = mkNode(ks, sx + COUPLE_SPACING * 2, childY, pn.depth, kid);
              addNode(sn);
              addNode(spn);
              sibNodes.push(sn);
              allConns.push({
                x1: sn.x, y1: sn.y, x2: spn.x, y2: spn.y,
                type: 'couple', seed: hsh(kid + ks), depth: sn.depth,
              });
              sx += COUPLE_WIDTH + CHILD_GAP;
            } else {
              // Solo sibling
              const sn = mkNode(kid, sx, childY, pn.depth);
              addNode(sn);
              sibNodes.push(sn);
              sx += SOLO_WIDTH + CHILD_GAP;
            }
          }

          // Center parents above all children
          const allChildNodes = [...existingKids, ...sibNodes];
          const xs = allChildNodes.map(n => n.x);
          const center = (Math.min(...xs) + Math.max(...xs)) / 2;

          if (g2) {
            // Couple parents
            const n1 = mkNode(g1, center - COUPLE_SPACING, parentY, pn.depth - 1);
            const n2 = mkNode(g2, center + COUPLE_SPACING, parentY, pn.depth - 1, g1);
            addNode(n1);
            addNode(n2);
            allConns.push({
              x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y,
              type: 'couple', seed: hsh(g1 + g2), depth: n1.depth,
            });
            // Branch from couple center to each child
            for (const cn of allChildNodes) {
              allConns.push({
                x1: center, y1: parentY + NODE_R + TRUNK_OFFSET,
                x2: cn.x, y2: cn.y - NODE_R - TRUNK_OFFSET,
                type: 'branch', seed: hsh(cn.id + 'anc'), depth: cn.depth,
              });
            }
            next.push(g1, g2);
          } else {
            // Single parent
            const n1 = mkNode(g1, center, parentY, pn.depth - 1);
            addNode(n1);
            for (const cn of allChildNodes) {
              allConns.push({
                x1: center, y1: parentY + NODE_R + TRUNK_OFFSET,
                x2: cn.x, y2: cn.y - NODE_R - TRUNK_OFFSET,
                type: 'branch', seed: hsh(cn.id + 'anc'), depth: cn.depth,
              });
            }
            next.push(g1);
          }
        }

        // Next round: newly placed parents + anyone else with unplaced parents
        const nextSet = new Set(next);
        findNeedingParents().forEach(id => nextSet.add(id));
        queue = [...nextSet].filter(id => parentsOf(id).some(pid => !placed.has(pid)));
      }

      // Normalize: shift so topmost node is at INITIAL_Y and leftmost at MIN_EDGE_X
      let minY = Infinity, minX = Infinity;
      allNodes.forEach(n => { if (n.y < minY) minY = n.y; if (n.x < minX) minX = n.x; });
      const yShift = INITIAL_Y - minY;
      const xShift = MIN_EDGE_X - minX;
      if (yShift !== 0 || xShift !== 0) {
        allNodes.forEach(n => { n.x += xShift; n.y += yShift; });
        allConns.forEach(c => { c.x1 += xShift; c.y1 += yShift; c.x2 += xShift; c.y2 += yShift; });
      }

      result = { nodes: allNodes, conns: allConns };
    } else if (mode === 'ancestors') {
      const tree = buildAncestorTree(state, rootId);
      const raw = layoutTree(tree);
      const flipped = flipLayoutY(raw.nodes, raw.conns);
      const coupleConns = addAncestorCoupleConns(flipped.nodes, state);
      result = { nodes: flipped.nodes, conns: [...flipped.conns, ...coupleConns] };
      inTree = getTreePersonIds(tree);
    } else {
      const tree = buildTree(state, rootId);
      result = layoutTree(tree);
      inTree = getTreePersonIds(tree);
    }

    // Add disconnected people as standalone nodes
    const disconnected = state.people.filter(p => !inTree.has(p.id));
    if (disconnected.length > 0) {
      let maxX = 0;
      result.nodes.forEach(n => { if (n.x > maxX) maxX = n.x; });
      let offsetX = maxX + DISCONNECTED_MARGIN;
      const baseY = mode === 'ancestors'
        ? Math.max(...result.nodes.map(n => n.y), 80)
        : 80;
      disconnected.forEach(p => {
        result.nodes.push({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          born: p.birthDate || '',
          x: offsetX,
          y: baseY,
          depth: 0,
        });
        offsetX += DISCONNECTED_GAP;
      });
    }

    return result;
  }, [state.people, state.parentChildRelationships, state.marriages, rootId, mode]);

  const geo = useMemo(() => {
    const trunkConns = layout.conns.filter(c => c.type === 'trunk');
    const trunks = trunkConns.map(c => {
      const topY = Math.min(c.y1, c.y2);
      const botY = Math.max(c.y1, c.y2);
      const isRootTrunk = c.depth === 0;
      const rootDir = isRootTrunk && mode !== 'both' ? (mode === 'ancestors' ? 'down' : 'up') : null;
      const raw = genTrunk(c.x1, topY, botY, TRUNK_BASE_WIDTH, c.seed, rootDir);
      return {
        ...c, bw: TRUNK_BASE_WIDTH, midW: raw.midW,
        path: mkPath(raw.path),
        furrows: raw.furrows.map(f => ({ ...f, path: mkPath(f.d) })),
        cracks: raw.cracks.map(cr => ({ ...cr, path: mkPath(cr.d) })),
        highlights: raw.highlights.map(h => ({ ...h, path: mkPath(h.d) })),
        knots: raw.knots, moss: raw.moss,
        rootDir: raw.rootDir,
        roots: raw.rootDir
          ? genRoots(c.x1, raw.rootDir === 'up' ? topY : botY, TRUNK_BASE_WIDTH, c.seed, raw.rootDir).map(d => mkPath(d))
          : [],
        topLeaves: genCanopy(c.x1, topY + 10, 28, 18, 30, c.seed + 7000),
      };
    });

    const branches = layout.conns.filter(c => c.type === 'branch').map(c => {
      const raw = genBranch(c.x1, c.y1, c.x2, c.y2, c.seed);
      return {
        ...c,
        path: mkPath(raw.path),
        barkLines: raw.barkLines.map(bl => ({ ...bl, path: mkPath(bl.d) })),
        twigs: raw.twigs.map(tw => ({ ...tw, path: mkPath(tw.d) })),
        midLeaves: genCanopy((c.x1 + c.x2) / 2, (c.y1 + c.y2) / 2, 20, 14, 20, c.seed + 4000),
        tipLeaves: genCanopy(c.x2, c.y2 - 14, 18, 12, 18, c.seed + 5000),
      };
    });

    const couples = layout.conns.filter(c => c.type === 'couple');
    const animals = placeAnimals(layout.conns);
    const labels = layout.nodes.map(n => {
      const parts = n.name.split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      return {
        id: n.id,
        name: mkPara(first, 10, P.ink, LABEL_BOX.width, true),
        surname: mkPara(last, 9, P.ink, LABEL_BOX.width),
        born: mkPara(n.born ? `ur. ${n.born}` : '', 8, P.inkFade, LABEL_BOX.width),
      };
    });
    return { trunks, branches, couples, animals, labels };
  }, [layout, mode]);

  // === ANIMATIONS ===
  const windPhase = useSharedValue(0);
  useEffect(() => {
    windPhase.value = withRepeat(withTiming(Math.PI * 2, { duration: ANIM.wind, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const owlBlink = useSharedValue(1);
  useEffect(() => {
    owlBlink.value = withDelay(ANIM.blinkDelay, withRepeat(
      withSequence(
        withTiming(0.05, { duration: ANIM.blinkClose }),
        withTiming(1, { duration: ANIM.blinkOpen }),
        withDelay(ANIM.blinkInterval, withTiming(1, { duration: 0 })),
      ), -1, false,
    ));
  }, []);

  const birdBob = useSharedValue(0);
  useEffect(() => {
    birdBob.value = withRepeat(withSequence(
      withTiming(-1.5, { duration: ANIM.bobUp, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.5, { duration: ANIM.bobDown, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: ANIM.bobSettle }),
      withDelay(ANIM.bobPause, withTiming(0, { duration: 0 })),
    ), -1, false);
  }, []);

  const tailWag = useSharedValue(0);
  useEffect(() => {
    tailWag.value = withRepeat(withTiming(0.12, { duration: ANIM.tailWag, easing: Easing.inOut(Easing.sin) }), -1, true);
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

  const nodesRef = layout.nodes;

  const handleTap = (tapX: number, tapY: number) => {
    const canvasX = (tapX - tx.value) / sc.value;
    const canvasY = (tapY - ty.value) / sc.value;
    const hit = nodesRef.find(n =>
      Math.abs(canvasX - n.x) < NODE_R + 20 &&
      Math.abs(canvasY - n.y) < NODE_R + 20
    );
    if (hit) onNodePress(hit.id);
  };

  const handleLongPress = (tapX: number, tapY: number) => {
    const canvasX = (tapX - tx.value) / sc.value;
    const canvasY = (tapY - ty.value) / sc.value;
    const hit = nodesRef.find(n =>
      Math.abs(canvasX - n.x) < NODE_R + 20 &&
      Math.abs(canvasY - n.y) < NODE_R + 20
    );
    if (hit) onNodeLongPress(hit.id);
  };

  const pan = Gesture.Pan()
    .onStart(() => { stx.value = tx.value; sty.value = ty.value; })
    .onUpdate(e => { tx.value = stx.value + e.translationX; ty.value = sty.value + e.translationY; })
    .onEnd(e => { tx.value = withDecay({ velocity: e.velocityX, deceleration: 0.997 }); ty.value = withDecay({ velocity: e.velocityY, deceleration: 0.997 }); });

  const pinch = Gesture.Pinch()
    .onStart(e => { ssc.value = sc.value; fx.value = e.focalX; fy.value = e.focalY; })
    .onUpdate(e => {
      const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ssc.value * e.scale));
      const r = nz / sc.value;
      tx.value = fx.value - (fx.value - tx.value) * r;
      ty.value = fy.value - (fy.value - ty.value) * r;
      sc.value = nz;
    });

  const tap = Gesture.Tap()
    .onEnd(e => {
      runOnJS(handleTap)(e.x, e.y);
    });

  const longPress = Gesture.LongPress()
    .minDuration(ANIM.longPressDuration)
    .maxDistance(30)
    .onStart(e => {
      runOnJS(handleLongPress)(e.x, e.y);
    });

  const gesture = Gesture.Race(
    Gesture.Exclusive(longPress, tap),
    Gesture.Simultaneous(pan, pinch),
  );

  const cam = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }]);

  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const centerOnRoot = useCallback(() => {
    const node = layout.nodes.find(n => n.id === rootId);
    if (!node || canvasSize.w === 0) return;
    const easing = Easing.out(Easing.quad);
    tx.value = withTiming(canvasSize.w / 2 - node.x, { duration: ANIM.centerDuration, easing });
    ty.value = withTiming(canvasSize.h / 2 - node.y, { duration: ANIM.centerDuration, easing });
    sc.value = withTiming(1, { duration: ANIM.centerDuration, easing });
  }, [layout.nodes, rootId, canvasSize]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.wrap}
        onLayout={e => setCanvasSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <Canvas style={styles.cvs}>
          <Group transform={cam}>

            {/* TRUNKS */}
            {geo.trunks.map((t, i) => (
              <Group key={`t${i}`}>
                <Group transform={[{ translateX: SHADOW_OFFSET.trunk.x }, { translateY: SHADOW_OFFSET.trunk.y }]}>
                  <Path path={t.path} color={P.shadow.trunk} />
                </Group>
                <Path path={t.path} style="fill">
                  <LinearGradient start={vec(t.x1 - 12, t.y1)} end={vec(t.x1 + 12, t.y1)} colors={[P.bark.light, P.bark.mid, P.bark.dark, P.bark.mid, P.bark.light]} />
                </Path>
                <Path path={t.path} style="fill" opacity={0.2}>
                  <LinearGradient start={vec(t.x1, t.y1)} end={vec(t.x1, t.y2)} colors={[P.bark.highlight, 'transparent', P.bark.shadow]} />
                </Path>
                {t.furrows.map((f, fi) => <Path key={fi} path={f.path} style="stroke" color={P.bark.deep} strokeWidth={f.w} opacity={f.op} strokeCap="round" />)}
                {t.highlights.map((h, hi) => <Path key={hi} path={h.path} style="stroke" color="rgba(255,255,240,0.06)" strokeWidth={h.w} opacity={h.op} strokeCap="round" />)}
                {t.knots.map((k, ki) => (
                  <Group key={ki}>
                    <Oval x={k.cx - k.rx} y={k.cy - k.ry} width={k.rx * 2} height={k.ry * 2} color={P.bark.shadow} opacity={k.op} />
                    <Oval x={k.cx - k.rx * 0.55} y={k.cy - k.ry * 0.55} width={k.rx * 1.1} height={k.ry * 1.1} color={P.bark.deep} style="stroke" strokeWidth={0.3} opacity={k.op * 0.5} />
                  </Group>
                ))}
                {t.moss.map((m, mi) => <Oval key={mi} x={m.cx - m.rx} y={m.cy - m.ry} width={m.rx * 2} height={m.ry * 2} color={m.col} opacity={m.op} />)}
                {t.roots.map((rp, ri) => (
                  <Group key={`root${ri}`}>
                    <Group transform={[{ translateX: SHADOW_OFFSET.root.x }, { translateY: SHADOW_OFFSET.root.y }]}>
                      <Path path={rp} color={P.shadow.trunk} />
                    </Group>
                    <Path path={rp} style="fill">
                      <LinearGradient start={vec(t.x1 - 15, t.y1)} end={vec(t.x1 + 15, t.y1)} colors={[P.bark.light, P.bark.mid, P.bark.dark, P.bark.mid, P.bark.light]} />
                    </Path>
                    <Path path={rp} style="fill" opacity={0.15}>
                      <LinearGradient start={vec(t.x1, t.y1)} end={vec(t.x1, t.y2)} colors={[P.bark.highlight, 'transparent', P.bark.shadow]} />
                    </Path>
                  </Group>
                ))}
                <Group transform={leafSway[i % 3]} origin={vec(t.x1, t.y2 - 10)}>
                  {t.topLeaves.map((l, li) => (
                    <Group key={li} transform={[{ translateX: l.x }, { translateY: l.y }, { rotate: (l.rot * Math.PI) / 180 }]}>
                      <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                      {l.layer > 0 && <Path path={leafVeinPath(l.sz)} style="stroke" color={P.leaf.deep} strokeWidth={0.3} opacity={0.2} />}
                    </Group>
                  ))}
                </Group>
              </Group>
            ))}

            {/* BRANCHES */}
            {geo.branches.map((b, i) => (
              <Group key={`b${i}`}>
                <Group transform={[{ translateX: SHADOW_OFFSET.branch.x }, { translateY: SHADOW_OFFSET.branch.y }]}>
                  <Path path={b.path} color={P.shadow.branch} />
                </Group>
                <Path path={b.path} style="fill">
                  <LinearGradient start={vec(b.x1, b.y1)} end={vec(b.x2, b.y2)} colors={[P.bark.mid, P.bark.dark, P.bark.edge]} />
                </Path>
                {b.barkLines.map((bl, bi) => <Path key={bi} path={bl.path} style="stroke" color={P.bark.deep} strokeWidth={bl.w} opacity={bl.op} strokeCap="round" />)}
                {b.twigs.map((tw, ti) => <Path key={ti} path={tw.path} style="stroke" color={P.bark.mid} strokeWidth={tw.w} opacity={0.4} strokeCap="round" />)}
                <Group transform={leafSway[(i + 1) % 3]} origin={vec((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2)}>
                  {b.midLeaves.map((l, li) => (
                    <Group key={li} transform={[{ translateX: l.x }, { translateY: l.y }, { rotate: (l.rot * Math.PI) / 180 }]}>
                      <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                      {l.layer > 0 && <Path path={leafVeinPath(l.sz)} style="stroke" color={P.leaf.deep} strokeWidth={0.25} opacity={0.18} />}
                    </Group>
                  ))}
                </Group>
                <Group transform={leafSway[(i + 2) % 3]} origin={vec(b.x2, b.y2 - 14)}>
                  {b.tipLeaves.map((l, li) => (
                    <Group key={`tp${li}`} transform={[{ translateX: l.x }, { translateY: l.y }, { rotate: (l.rot * Math.PI) / 180 }]}>
                      <Path path={leafPath(l.sz, l.type)} color={l.col} opacity={l.op} />
                    </Group>
                  ))}
                </Group>
              </Group>
            ))}

            {/* ANIMALS */}
            {geo.animals.map((a, i) => {
              if (a.type === 'owl') return <OwlComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} eyeScale={owlEyeT} />;
              if (a.type === 'bird') return <BirdComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} bobTransform={birdBobT} />;
              if (a.type === 'squirrel') return <SquirrelComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} tailTransform={tailWagT} />;
              return null;
            })}

            {/* COUPLES */}
            {geo.couples.map((c, i) => {
              const mx = (c.x1 + c.x2) / 2;
              const line1 = mkPath(`M ${c.x1 + NODE_R},${c.y1} L ${c.x2 - NODE_R},${c.y2}`);
              const line2 = mkPath(`M ${c.x1 + NODE_R},${c.y1 + COUPLE_LINE.offset} L ${c.x2 - NODE_R},${c.y2 + COUPLE_LINE.offset}`);
              return (
                <Group key={`c${i}`}>
                  <Path path={line1} style="stroke" color={P.sepia} strokeWidth={STROKE.coupleLine} />
                  <Path path={line2} style="stroke" color={P.sepia} strokeWidth={STROKE.coupleLine} />
                  <Circle cx={mx} cy={c.y1} r={COUPLE_LINE.circleR} color={P.cream} />
                  <Circle cx={mx} cy={c.y1} r={COUPLE_LINE.circleR} color={P.red} style="stroke" strokeWidth={STROKE.coupleLine} />
                </Group>
              );
            })}

            {/* NODES */}
            {layout.nodes.map(n => {
              const lb = geo.labels.find(l => l.id === n.id);
              const isRoot = n.id === rootId;
              return (
                <Group key={n.id}>
                  <Circle cx={n.x + SHADOW_OFFSET.node.x} cy={n.y + SHADOW_OFFSET.node.y} r={NODE_R} color={P.shadow.node} />
                  {isRoot && <Circle cx={n.x} cy={n.y} r={NODE_GLOW_R} color={P.hl.glow} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.cream} />
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={isRoot ? P.hl.ring : P.sepia} style="stroke" strokeWidth={isRoot ? STROKE.rootRing : STROKE.nodeRing} />
                  <Circle cx={n.x} cy={n.y} r={NODE_INNER_R} color={P.parchDk} style="stroke" strokeWidth={STROKE.innerRing} opacity={0.4} />
                  <RoundedRect x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 3} width={LABEL_BOX.width} height={LABEL_BOX.height} r={LABEL_BOX.radius} color={P.cream} />
                  <RoundedRect x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 3} width={LABEL_BOX.width} height={LABEL_BOX.height} r={LABEL_BOX.radius} color={P.parchEdge} style="stroke" strokeWidth={STROKE.labelBox} />
                  {lb && <>
                    <Paragraph paragraph={lb.name} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 5} width={LABEL_BOX.width} />
                    <Paragraph paragraph={lb.surname} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 18} width={LABEL_BOX.width} />
                    <Paragraph paragraph={lb.born} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 30} width={LABEL_BOX.width} />
                  </>}
                </Group>
              );
            })}

          </Group>
        </Canvas>
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnRoot} activeOpacity={0.7}>
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color={P.bark.mid} />
        </TouchableOpacity>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  cvs: { flex: 1 },
  centerBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cream,
    borderWidth: 1,
    borderColor: P.parchEdge,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
