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
import { buildTree, buildAncestorTree, layoutTree, flipLayoutY, getTreePersonIds, NODE_R } from '../../utils/treeLayout';
import type { TreeMode } from '../../utils/treeLayout';
import { P, mkPath, mkPara } from './constants';
import { genTrunk, genBranch, genCanopy, leafPath, leafVeinPath, placeAnimals } from './geometry';
import { OwlComponent, BirdComponent, SquirrelComponent } from './animals';

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
    let tree;
    let result;

    if (mode === 'ancestors') {
      tree = buildAncestorTree(state, rootId);
      const raw = layoutTree(tree);
      result = flipLayoutY(raw.nodes, raw.conns);
    } else {
      tree = buildTree(state, rootId);
      result = layoutTree(tree);
    }

    // Add disconnected people as standalone nodes
    const inTree = getTreePersonIds(tree);
    const disconnected = state.people.filter(p => !inTree.has(p.id));
    if (disconnected.length > 0) {
      let maxX = 0;
      result.nodes.forEach(n => { if (n.x > maxX) maxX = n.x; });
      let offsetX = maxX + 120;
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
        offsetX += 100;
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
      const rootDir = isRootTrunk ? (mode === 'ancestors' ? 'down' : 'up') : null;
      const raw = genTrunk(c.x1, topY, botY, 48, c.seed, rootDir);
      return {
        ...c, bw: 48, midW: raw.midW,
        path: mkPath(raw.path),
        furrows: raw.furrows.map(f => ({ ...f, path: mkPath(f.d) })),
        cracks: raw.cracks.map(cr => ({ ...cr, path: mkPath(cr.d) })),
        highlights: raw.highlights.map(h => ({ ...h, path: mkPath(h.d) })),
        knots: raw.knots, moss: raw.moss,
        roots: raw.roots.map(r => ({
          path: mkPath(r.path),
          barkLines: r.barkLines.map(bl => ({ ...bl, path: mkPath(bl.d) })),
        })),
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
    const labels = layout.nodes.map(n => ({
      id: n.id,
      name: mkPara(n.name.split(' ')[0], 10, P.ink, 80, true),
      born: mkPara(n.born ? `ur. ${n.born}` : '', 8, P.inkFade, 80),
    }));
    return { trunks, branches, couples, animals, labels };
  }, [layout, mode]);

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
      const nz = Math.min(4, Math.max(0.3, ssc.value * e.scale));
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
    .minDuration(500)
    .onEnd(e => {
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
    tx.value = withTiming(canvasSize.w / 2 - node.x, { duration: 350, easing: Easing.out(Easing.quad) });
    ty.value = withTiming(canvasSize.h / 2 - node.y, { duration: 350, easing: Easing.out(Easing.quad) });
    sc.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
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
                <Group transform={[{ translateX: 3 }, { translateY: 4 }]}>
                  <Path path={t.path} color="rgba(15,8,0,0.1)" />
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
                {t.roots.map((r, ri) => (
                  <Group key={`r${ri}`}>
                    <Group transform={[{ translateX: 1.5 }, { translateY: 2 }]}>
                      <Path path={r.path} color="rgba(15,8,0,0.08)" />
                    </Group>
                    <Path path={r.path} style="fill" color={P.bark.dark} />
                    <Path path={r.path} style="fill" opacity={0.25}>
                      <LinearGradient start={vec(0, 0)} end={vec(0, 30)} colors={[P.bark.mid, P.bark.shadow]} />
                    </Path>
                    {r.barkLines.map((bl, bi) => <Path key={bi} path={bl.path} style="stroke" color={P.bark.deep} strokeWidth={bl.w} opacity={bl.op} strokeCap="round" />)}
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
                <Group transform={[{ translateX: 2 }, { translateY: 3 }]}>
                  <Path path={b.path} color="rgba(15,8,0,0.07)" />
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
              const line2 = mkPath(`M ${c.x1 + NODE_R},${c.y1 + 3} L ${c.x2 - NODE_R},${c.y2 + 3}`);
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
              const isRoot = n.id === rootId;
              return (
                <Group key={n.id}>
                  <Circle cx={n.x + 1.5} cy={n.y + 2.5} r={NODE_R} color="rgba(20,10,0,0.1)" />
                  {isRoot && <Circle cx={n.x} cy={n.y} r={NODE_R + 5} color={P.hl.glow} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.cream} />
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={isRoot ? P.hl.ring : P.sepia} style="stroke" strokeWidth={isRoot ? 2.5 : 1.5} />
                  <Circle cx={n.x} cy={n.y} r={NODE_R - 3} color={P.parchDk} style="stroke" strokeWidth={0.4} opacity={0.4} />
                  <RoundedRect x={n.x - 40} y={n.y + NODE_R + 3} width={80} height={32} r={5} color={P.cream} />
                  <RoundedRect x={n.x - 40} y={n.y + NODE_R + 3} width={80} height={32} r={5} color={P.parchEdge} style="stroke" strokeWidth={0.6} />
                  {lb && <>
                    <Paragraph paragraph={lb.name} x={n.x - 40} y={n.y + NODE_R + 6} width={80} />
                    <Paragraph paragraph={lb.born} x={n.x - 40} y={n.y + NODE_R + 19} width={80} />
                  </>}
                </Group>
              );
            })}

          </Group>
        </Canvas>
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnRoot} activeOpacity={0.7}>
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#5D4037" />
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
    backgroundColor: '#fdf6e3',
    borderWidth: 1,
    borderColor: '#d4c08f',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
