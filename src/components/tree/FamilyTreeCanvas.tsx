import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Canvas, Path, Group, Circle, RoundedRect,
  LinearGradient, vec, Paragraph, ImageSVG,
  Skia,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue, useDerivedValue, withDecay,
  withRepeat, withTiming, withSequence, withDelay,
  Easing, runOnJS,
} from 'react-native-reanimated';
import type { FamilyState } from '../../types';
import {
  computeUnifiedLayout, NODE_R,
} from '../../utils/treeLayout';
import { computeRelationshipLabels } from '../../utils/relationshipLabels';
import { P } from './palette';
import { mkPath } from './skiaHelpers';
import { mkPara } from './skiaHelpers';
import { WEDDING_RINGS_SVG, TREE_TRUNK_ROOTS_SVG } from './svgAssets';
import { genBranch, genCanopy, leafPath, leafVeinPath, placeAnimals } from './geometry';
import { OwlComponent, BirdComponent, SquirrelComponent } from './animals';

// ======================== CANVAS CONSTANTS ========================

/** Width of the trunk+roots SVG anchored under the root person (height derived from 90×72 aspect) */
const TRUNK_ROOTS_W = 180;
const TRUNK_ROOTS_H = TRUNK_ROOTS_W * (72 / 90);
/** How far the SVG overlaps the root person's circle so the trunk visually grows out of it */
const TRUNK_ROOTS_OVERLAP = 8;

/** Offset for shadow elements */
const SHADOW_OFFSET = { branch: { x: 2, y: 3 }, node: { x: 1.5, y: 2.5 } };

/** Node label box dimensions */
const LABEL_BOX = { width: 80, height: 54, radius: 5 };

/** Node circle sizes */
const NODE_GLOW_R = NODE_R + 5;

/** Stroke widths */
const STROKE = { rootRing: 2.5, nodeRing: 1.5, innerRing: 0.4, labelBox: 0.6, coupleLine: 1 };


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
  onNodePress: (personId: string) => void;
  onNodeLongPress: (personId: string) => void;
};

// ======================== PERSON INITIALS ========================
function PersonInitials({ x, y, name }: { x: number; y: number; name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  const para = mkPara(initials.toUpperCase(), 16, P.sepia, NODE_R * 2, true);
  return (
    <Paragraph paragraph={para} x={x - NODE_R} y={y - 6} width={NODE_R * 2} />
  );
}

// ======================== MOURNING BAND (thin diagonal strip, lower-right) ========================
const weddingRingsSvg = Skia.SVG.MakeFromString(WEDDING_RINGS_SVG);
const treeTrunkRootsSvg = Skia.SVG.MakeFromString(TREE_TRUNK_ROOTS_SVG);

function MourningBand({ x, y }: { x: number; y: number }) {
  const r = NODE_R;
  const w = 4; // band thickness
  // Diagonal strip from bottom-center to right-center, clipped to circle
  const half = w / 2;
  const d = `M ${x + r * 0.05 - half} ${y + r * 1.0}
    L ${x + r * 0.05 + half} ${y + r * 1.0}
    L ${x + r * 1.0} ${y + r * 0.05 + half}
    L ${x + r * 1.0} ${y + r * 0.05 - half} Z`;
  const bandPath = Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
  const clip = Skia.Path.Make();
  clip.addCircle(x, y, r - 1);
  return (
    <Group clip={clip}>
      <Path path={bandPath} color="rgba(0,0,0,0.8)" />
    </Group>
  );
}

// ======================== MAIN COMPONENT ========================
export function FamilyTreeCanvas({ state, rootId, onNodePress, onNodeLongPress }: Props) {
  const layout = useMemo(() => {
    const labels = computeRelationshipLabels(rootId, state);
    return computeUnifiedLayout(rootId, state, labels);
  }, [state.people, state.parentChildRelationships, state.marriages, rootId]);

  const geo = useMemo(() => {
    const rootNode = layout.nodes.find(n => n.id === rootId);
    const rootY = rootNode?.y ?? 0;

    const branches = layout.conns.filter(c => c.type === 'branch').map(c => {
      const thickAtStart = Math.abs(c.y1 - rootY) <= Math.abs(c.y2 - rootY);
      const raw = genBranch(c.x1, c.y1, c.x2, c.y2, c.seed, thickAtStart);
      return {
        ...c,
        path: mkPath(raw.path),
        barkLines: raw.barkLines.map(bl => ({ ...bl, path: mkPath(bl.d) })),
        twigs: raw.twigs.map(tw => ({ ...tw, path: mkPath(tw.d) })),
        midLeaves: genCanopy((c.x1 + c.x2) / 2, (c.y1 + c.y2) / 2 - 16, 20, 14, 20, c.seed + 4000),
        tipLeaves: genCanopy(c.x2, c.y2 - 30, 18, 12, 18, c.seed + 5000),
      };
    });

    const couples = layout.conns.filter(c => c.type === 'couple');
    const animals = placeAnimals(layout.conns);
    const nodeLabels = layout.nodes.map(n => {
      const parts = n.name.split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      return {
        id: n.id,
        name: mkPara(first, 10, P.ink, LABEL_BOX.width, true),
        surname: mkPara(last, 9, P.ink, LABEL_BOX.width),
        born: mkPara(n.born ? `ur. ${n.born}` : '', 8, P.inkFade, LABEL_BOX.width),
        relation: n.label ? mkPara(n.label, 7, P.sepia, LABEL_BOX.width) : null,
      };
    });
    // Direction of trunk+roots: down if root has parents (ancestors above),
    // up if root has only descendants below (no parents).
    const rootHasParents = state.parentChildRelationships.some(r => r.childId === rootId);

    return { rootNode, branches, couples, animals, labels: nodeLabels, rootHasParents };
  }, [layout, rootId, state.parentChildRelationships]);

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

            {/* TREE BASE — single SVG (trunk + roots) anchored to the selected root person.
                Direction depends on family structure:
                  - has parents → growing DOWN (ancestors above, tree base hangs below the root)
                  - no parents → growing UP (only descendants below, tree base flips above the root) */}
            {geo.rootNode && treeTrunkRootsSvg && (() => {
              const anchorY = geo.rootHasParents
                ? geo.rootNode.y + NODE_R - TRUNK_ROOTS_OVERLAP
                : geo.rootNode.y - NODE_R + TRUNK_ROOTS_OVERLAP;
              const flipY = geo.rootHasParents ? 1 : -1;
              return (
                <Group transform={[
                  { translateY: anchorY },
                  { scaleY: flipY },
                  { translateY: -anchorY },
                ]}>
                  <ImageSVG
                    svg={treeTrunkRootsSvg}
                    x={geo.rootNode.x - TRUNK_ROOTS_W / 2}
                    y={anchorY}
                    width={TRUNK_ROOTS_W}
                    height={TRUNK_ROOTS_H}
                  />
                </Group>
              );
            })()}

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

            {/* NODES */}
            {layout.nodes.map(n => {
              const lb = geo.labels.find(l => l.id === n.id);
              const isRoot = n.id === rootId;
              return (
                <Group key={n.id}>
                  <Circle cx={n.x + SHADOW_OFFSET.node.x} cy={n.y + SHADOW_OFFSET.node.y} r={NODE_R} color={P.shadow.node} />
                  {isRoot && <Circle cx={n.x} cy={n.y} r={NODE_GLOW_R} color={P.hl.glow} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.cream} />
                  <PersonInitials x={n.x} y={n.y} name={n.name} />
                  {n.isDead && <MourningBand x={n.x} y={n.y} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={isRoot ? P.hl.ring : P.sepia} style="stroke" strokeWidth={isRoot ? STROKE.rootRing : STROKE.nodeRing} />
                  <RoundedRect x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 3} width={LABEL_BOX.width} height={LABEL_BOX.height} r={LABEL_BOX.radius} color={P.cream} />
                  <RoundedRect x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 3} width={LABEL_BOX.width} height={LABEL_BOX.height} r={LABEL_BOX.radius} color={P.parchEdge} style="stroke" strokeWidth={STROKE.labelBox} />
                  {lb && <>
                    <Paragraph paragraph={lb.name} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 5} width={LABEL_BOX.width} />
                    <Paragraph paragraph={lb.surname} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 18} width={LABEL_BOX.width} />
                    <Paragraph paragraph={lb.born} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 30} width={LABEL_BOX.width} />
                    {lb.relation && <Paragraph paragraph={lb.relation} x={n.x - LABEL_BOX.width / 2} y={n.y + NODE_R + 41} width={LABEL_BOX.width} />}
                  </>}
                </Group>
              );
            })}

            {/* COUPLES — interlinked rings SVG, rendered ON TOP of nodes */}
            {geo.couples.map((c, i) => {
              const mx = (c.x1 + c.x2) / 2;
              const ringsW = 28;
              const ringsH = ringsW * (836 / 801);
              const rx = mx - ringsW / 2;
              const ry = c.y1 - ringsH / 2;
              return (
                <Group key={`cr${i}`}>
                  {weddingRingsSvg && (
                    <ImageSVG svg={weddingRingsSvg} x={rx} y={ry} width={ringsW} height={ringsH} />
                  )}
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
