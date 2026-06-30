import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Canvas, Path, Group, Circle, RoundedRect,
  LinearGradient, RadialGradient, vec, Paragraph, ImageSVG,
  Skia, DashPathEffect,
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
import { consumeInitialTreeZoom } from '../../utils/screenshotMode';
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

/** Node label box — fixed width, rounded corners. Height is computed per node
 *  from the real (line-capped) text height so long names never overflow. */
const LABEL_BOX = {
  width: 80,
  radius: 5,
  gapFromNode: 3, // gap between circle bottom and box top
  padTop: 3,
  padBottom: 4,
  rowGap: 1,
  minHeight: 54,
};

/**
 * Bounds of a person's label card (the parchment box below the circle), in
 * canvas coordinates. Single source of truth shared by rendering and hit-testing
 * so the touch target always matches the drawn card.
 */
function labelCardBounds(n: { x: number; y: number }, height: number) {
  return {
    left: n.x - LABEL_BOX.width / 2,
    top: n.y + NODE_R + LABEL_BOX.gapFromNode,
    width: LABEL_BOX.width,
    height,
  };
}

/** Node circle sizes */
const NODE_GLOW_R = NODE_R + 5;

/** Stroke widths */
const STROKE = { rootRing: 2.5, nodeRing: 1.5, innerRing: 0.4, labelBox: 0.6, coupleLine: 1 };


/** Gesture zoom limits */
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 4;

/** Extra touch radius around a node circle, so it is easy to tap. */
const TAP_SLOP = 20;

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
  glowPulse: 1400,
  rootRevealDuration: 280,
  bounceUp: 90,
  bounceDown: 140,
  bounceScale: 1.08,
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
  const { i18n } = useTranslation();
  const layout = useMemo(() => {
    // Only annotate close family in the tree (up to first cousins / close
    // in-laws). Distant-cousin "degree of kinship" labels are noise here.
    const labels = computeRelationshipLabels(rootId, state, 'colloquial', {
      maxSteps: 4,
      maxSpouseSteps: 1,
    });
    return computeUnifiedLayout(rootId, state, labels);
  }, [state.people, state.parentChildRelationships, state.marriages, rootId, i18n.language]);

  const geo = useMemo(() => {
    const rootNode = layout.nodes.find(n => n.id === rootId);
    const rootY = rootNode?.y ?? 0;

    const branches = layout.conns.filter(c => c.type === 'branch').map(c => {
      const thickAtStart = Math.abs(c.y1 - rootY) <= Math.abs(c.y2 - rootY);
      const raw = genBranch(c.x1, c.y1, c.x2, c.y2, c.seed, thickAtStart);
      // Sit decorations on the branch's own drawn centreline — so leaves and
      // animals stay ON long, sagging branches instead of floating above a
      // straight chord (the bug visible on large trees).
      const mid = raw.centerline[raw.centerline.length >> 1];
      return {
        ...c,
        centerline: raw.centerline,
        mid,
        path: mkPath(raw.path),
        barkLines: raw.barkLines.map(bl => ({ ...bl, path: mkPath(bl.d) })),
        twigs: raw.twigs.map(tw => ({ ...tw, path: mkPath(tw.d) })),
        midLeaves: genCanopy(mid.x, mid.y - 16, 20, 14, 20, c.seed + 4000),
        tipLeaves: genCanopy(c.x2, c.y2 - 30, 18, 12, 18, c.seed + 5000),
      };
    });

    const couples = layout.conns.filter(c => c.type === 'couple');
    const extraCouples = layout.conns.filter(c => c.type === 'extra-couple');
    const animals = placeAnimals(branches);
    const personById = new Map(state.people.map(p => [p.id, p]));
    const nodeLabels = layout.nodes.map(n => {
      const parts = n.name.split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      const birthSurname = personById.get(n.id)?.birthSurname;
      // Each field wraps to as many lines as it needs (no ellipsis) — full
      // names like "Nowak z domu Kowalskich" stay readable. The box grows to
      // fit. A generous line cap only guards against pathological input.
      const paras = [
        first ? mkPara(first, 10, P.ink, LABEL_BOX.width, true, 2) : null,
        last ? mkPara(last, 9, P.ink, LABEL_BOX.width, false, 3) : null,
        birthSurname ? mkPara(`z d. ${birthSurname}`, 8, P.inkFade, LABEL_BOX.width, false, 2) : null,
        n.born ? mkPara(`ur. ${n.born}`, 8, P.inkFade, LABEL_BOX.width, false, 1) : null,
        n.label ? mkPara(n.label, 7, P.sepia, LABEL_BOX.width, false, 2) : null,
      ];
      // Stack rows by their real laid-out height → dynamic box height.
      const rows: { para: ReturnType<typeof mkPara>; y: number }[] = [];
      let y = LABEL_BOX.padTop;
      for (const para of paras) {
        if (!para) continue;
        rows.push({ para, y });
        y += para.getHeight() + LABEL_BOX.rowGap;
      }
      const boxHeight = Math.max(LABEL_BOX.minHeight, y - LABEL_BOX.rowGap + LABEL_BOX.padBottom);
      return { id: n.id, rows, boxHeight };
    });
    // Direction of trunk+roots: roots DOWN when there is any family ABOVE the
    // root (a tree standing in the ground), roots UP (flipped) only when the
    // root is a progenitor with nothing above it. We test the laid-out
    // positions rather than just the root's own parents, so ancestors reached
    // through marriage (in-laws, spouse's grandparents) flip the trunk too.
    const rootHasAncestors = rootNode
      ? layout.nodes.some(n => n.y < rootNode.y - 1)
      : false;

    return { rootNode, branches, couples, extraCouples, animals, labels: nodeLabels, rootHasAncestors };
  }, [layout, rootId, state.parentChildRelationships, state.people]);

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

  // Pulsing halo around the selected root person
  const rootGlow = useSharedValue(0);
  useEffect(() => {
    rootGlow.value = withRepeat(
      withTiming(1, { duration: ANIM.glowPulse, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, []);
  const glowR = useDerivedValue(() => NODE_GLOW_R + rootGlow.value * 5);
  const glowOpacity = useDerivedValue(() => 0.18 + rootGlow.value * 0.17);

  // Fade-in when the selected root person changes (smooth swap, no snap)
  const canvasOpacity = useSharedValue(1);
  useEffect(() => {
    canvasOpacity.value = 0;
    canvasOpacity.value = withTiming(1, { duration: ANIM.rootRevealDuration, easing: Easing.out(Easing.quad) });
  }, [rootId]);

  const leafSway = [
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value) * 0.03 }]),
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value + 1.2) * 0.04 }]),
    useDerivedValue(() => [{ rotate: Math.sin(windPhase.value + 2.4) * 0.035 }]),
  ];
  // Trunk + roots SVG sways slower and ~3× more subtly than the leaves
  const trunkSway = useDerivedValue(() => [{ rotate: Math.sin(windPhase.value * 0.5) * 0.012 }]);
  const owlEyeT = useDerivedValue(() => [{ scaleY: owlBlink.value }]);
  const birdBobT = useDerivedValue(() => [{ translateY: birdBob.value }]);
  const tailWagT = useDerivedValue(() => [{ rotate: tailWag.value }]);

  // Tap bounce — when a node is tapped, briefly scale it up around its center
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const bounceScale = useSharedValue(1);
  const bounceTransform = useDerivedValue(() => [{ scale: bounceScale.value }]);

  // === GESTURES ===
  const tx = useSharedValue(0), ty = useSharedValue(0), sc = useSharedValue(1);
  // Pinch bookkeeping — previous focal point, pinch scale, and pointer count.
  // Zoom/pan are applied as per-frame deltas relative to these (see pinch below).
  const pFocalX = useSharedValue(0), pFocalY = useSharedValue(0);
  const pScale = useSharedValue(1);
  const pPointers = useSharedValue(0);

  const nodesRef = layout.nodes;

  // Per-node label-box height, so taps land on the description card too — not
  // just the circle. The card grows to fit each person's name/dates.
  const labelHeightById = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of geo.labels) m.set(l.id, l.boxHeight);
    return m;
  }, [geo.labels]);

  /** Screen (gesture) coordinates → canvas coordinates, undoing pan + zoom. */
  const screenToCanvas = (screenX: number, screenY: number) => ({
    x: (screenX - tx.value) / sc.value,
    y: (screenY - ty.value) / sc.value,
  });

  // A node is "hit" when the touch falls on its circle OR on its label card
  // below. Same generous target for tap and long-press.
  const findHitNode = (screenX: number, screenY: number) => {
    const { x, y } = screenToCanvas(screenX, screenY);
    return nodesRef.find(n => {
      const onCircle =
        Math.abs(x - n.x) < NODE_R + TAP_SLOP && Math.abs(y - n.y) < NODE_R + TAP_SLOP;
      if (onCircle) return true;
      const card = labelCardBounds(n, labelHeightById.get(n.id) ?? LABEL_BOX.minHeight);
      return (
        x >= card.left && x <= card.left + card.width &&
        y >= card.top && y <= card.top + card.height
      );
    });
  };

  const handleTap = (tapX: number, tapY: number) => {
    const hit = findHitNode(tapX, tapY);
    if (hit) {
      setBouncingId(hit.id);
      bounceScale.value = withSequence(
        withTiming(ANIM.bounceScale, { duration: ANIM.bounceUp, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: ANIM.bounceDown, easing: Easing.inOut(Easing.quad) }),
      );
      onNodePress(hit.id);
    }
  };

  const handleLongPress = (tapX: number, tapY: number) => {
    const hit = findHitNode(tapX, tapY);
    if (hit) onNodeLongPress(hit.id);
  };

  // Single-finger pan only. Two-finger drag is handled by the pinch gesture
  // below (via its moving focal), so pan and pinch never fight over tx/ty —
  // which previously broke focal anchoring and made zoom drift toward a fixed
  // point ("zoomed to centre"), most noticeably on large trees.
  // Incremental change (changeX/changeY), NOT absolute translation: when a
  // pinch ends and you lift to one finger, pan activates with a large
  // accumulated translation — a `stx + translationX` formula would apply it in
  // one frame → a sudden jump. minDistance also stops a near-stationary
  // finger-lift from waking the pan (and flinging) at the end of a zoom.
  const pan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(6)
    .onChange(e => { tx.value += e.changeX; ty.value += e.changeY; })
    .onEnd(e => { tx.value = withDecay({ velocity: e.velocityX, deceleration: 0.997 }); ty.value = withDecay({ velocity: e.velocityY, deceleration: 0.997 }); });

  // Pinch zooms about the finger-centre (focal) and pans with it, applied as
  // per-frame DELTAS rather than from an absolute anchor. That is what stops a
  // finger-lift from jumping: when the pointer count changes, the focal centroid
  // snaps from between the fingers onto the remaining one — a discontinuity. We
  // detect it via e.numberOfPointers and rebase on that frame WITHOUT applying
  // it, so the snap is absorbed instead of being pushed into tx/ty.
  const pinch = Gesture.Pinch()
    .onStart(e => {
      pScale.value = 1;
      pFocalX.value = e.focalX;
      pFocalY.value = e.focalY;
      pPointers.value = e.numberOfPointers;
    })
    .onUpdate(e => {
      if (e.numberOfPointers !== pPointers.value) {
        // A finger was added or lifted — rebase and drop this frame's focal jump.
        pPointers.value = e.numberOfPointers;
        pScale.value = e.scale;
        pFocalX.value = e.focalX;
        pFocalY.value = e.focalY;
        return;
      }
      // Zoom about the focal using the incremental scale ratio.
      const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, sc.value * (e.scale / pScale.value)));
      const ratio = nz / sc.value;
      tx.value = e.focalX - (e.focalX - tx.value) * ratio;
      ty.value = e.focalY - (e.focalY - ty.value) * ratio;
      sc.value = nz;
      pScale.value = e.scale;
      // Pan by focal movement (two-finger drag).
      tx.value += e.focalX - pFocalX.value;
      ty.value += e.focalY - pFocalY.value;
      pFocalX.value = e.focalX;
      pFocalY.value = e.focalY;
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

  // Initial centering: jump (no animation) to root when canvas is first laid out
  // or when the selected root changes. Keeps user pan/zoom intact between renders.
  // Honors a one-shot initial-zoom override set via the screenshot deep link.
  const lastCenteredFor = React.useRef<string | null>(null);
  useEffect(() => {
    if (canvasSize.w === 0) return;
    if (lastCenteredFor.current === rootId) return;
    const node = layout.nodes.find(n => n.id === rootId);
    if (!node) return;
    const z = consumeInitialTreeZoom() ?? 1;
    tx.value = canvasSize.w / 2 - node.x * z;
    ty.value = canvasSize.h / 2 - node.y * z;
    sc.value = z;
    lastCenteredFor.current = rootId;
  }, [canvasSize.w, canvasSize.h, rootId, layout.nodes]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.wrap}
        onLayout={e => setCanvasSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <Canvas style={styles.cvs}>
          <Group transform={cam} opacity={canvasOpacity}>

            {/* TREE BASE — single SVG (trunk + roots) anchored to the selected root person.
                Direction depends on family structure:
                  - ancestors above → growing DOWN (tree base hangs below the root, roots in the ground)
                  - nothing above (progenitor) → growing UP (tree base flips above the root)
                Sways gently with the wind around its anchor (where it meets the circle).
                A soft "ground" shadow is drawn at the far end (only in the down-growing case). */}
            {geo.rootNode && treeTrunkRootsSvg && (() => {
              const anchorY = geo.rootHasAncestors
                ? geo.rootNode.y + NODE_R - TRUNK_ROOTS_OVERLAP
                : geo.rootNode.y - NODE_R + TRUNK_ROOTS_OVERLAP;
              const flipY = geo.rootHasAncestors ? 1 : -1;
              const farY = anchorY + flipY * TRUNK_ROOTS_H;
              return (
                <>
                  {/* Ground shadow — soft elliptical pool under the root tips. Only when growing down. */}
                  {geo.rootHasAncestors && (
                    <Group transform={[
                      { translateX: geo.rootNode.x },
                      { translateY: farY - 6 },
                      { scaleY: 0.22 },
                    ]}>
                      <Circle cx={0} cy={0} r={70}>
                        <RadialGradient
                          c={vec(0, 0)}
                          r={70}
                          colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)']}
                        />
                      </Circle>
                    </Group>
                  )}
                  <Group transform={trunkSway} origin={vec(geo.rootNode.x, anchorY)}>
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
                  </Group>
                </>
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
                <Group transform={leafSway[(i + 1) % 3]} origin={vec(b.mid.x, b.mid.y)}>
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

            {/* EXTRA-COUPLES — secondary marriages (no shared kids), rendered as dashed lines.
                Drawn before NODES so the circles cover the line endpoints. */}
            {geo.extraCouples.map((c, i) => {
              const d = `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
              return (
                <Path
                  key={`ec${i}`}
                  path={Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make()}
                  style="stroke"
                  color={P.sepia}
                  strokeWidth={1.5}
                  strokeCap="round"
                  opacity={0.6}
                >
                  <DashPathEffect intervals={[6, 4]} />
                </Path>
              );
            })}

            {/* ANIMALS */}
            {geo.animals.map((a, i) => {
              if (a.type === 'owl') return <OwlComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} eyeScale={owlEyeT} />;
              if (a.type === 'bird') return <BirdComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} bobTransform={birdBobT} />;
              if (a.type === 'squirrel') return <SquirrelComponent key={`a${i}`} x={a.x} y={a.y} flip={a.flip} tailTransform={tailWagT} />;
              return null;
            })}

            {/* NODES — the most-recently-tapped node bounces (scale up & settle) around its circle center */}
            {layout.nodes.map(n => {
              const lb = geo.labels.find(l => l.id === n.id);
              const isRoot = n.id === rootId;
              const isBouncing = n.id === bouncingId;
              const nodeBody = (
                <>
                  <Circle cx={n.x + SHADOW_OFFSET.node.x} cy={n.y + SHADOW_OFFSET.node.y} r={NODE_R} color={P.shadow.node} />
                  {isRoot && <Circle cx={n.x} cy={n.y} r={glowR} color={P.hl.ring} opacity={glowOpacity} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={P.cream} />
                  <PersonInitials x={n.x} y={n.y} name={n.name} />
                  {n.isDead && <MourningBand x={n.x} y={n.y} />}
                  <Circle cx={n.x} cy={n.y} r={NODE_R} color={isRoot ? P.hl.ring : P.sepia} style="stroke" strokeWidth={isRoot ? STROKE.rootRing : STROKE.nodeRing} />
                </>
              );
              return (
                <Group key={n.id}>
                  {isBouncing
                    ? <Group transform={bounceTransform} origin={vec(n.x, n.y)}>{nodeBody}</Group>
                    : nodeBody}
                  {(() => {
                    const card = labelCardBounds(n, lb ? lb.boxHeight : LABEL_BOX.minHeight);
                    return (
                      <>
                        <RoundedRect x={card.left} y={card.top} width={card.width} height={card.height} r={LABEL_BOX.radius} color={P.cream} />
                        <RoundedRect x={card.left} y={card.top} width={card.width} height={card.height} r={LABEL_BOX.radius} color={P.parchEdge} style="stroke" strokeWidth={STROKE.labelBox} />
                        {lb && lb.rows.map((row, ri) => (
                          <Paragraph key={ri} paragraph={row.para} x={card.left} y={card.top + row.y} width={card.width} />
                        ))}
                      </>
                    );
                  })()}
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
