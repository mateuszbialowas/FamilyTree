import React, { useMemo } from 'react';
import { Group, Path, Circle, Oval, vec } from '@shopify/react-native-skia';
import { P } from './palette';
import { mkPath } from './skiaHelpers';

export function OwlComponent({ x, y, flip, eyeScale }: { x: number; y: number; flip: boolean; eyeScale: any }) {
  const s = flip ? -1 : 1;
  const C = { body: '#8B4513', bodyDk: '#6B3410', face: '#D2691E', gold: '#FFD700', white: '#FFF', black: '#000' };
  const paths = useMemo(() => ({
    earL: mkPath('M -10.5,-16.5 L -9,-21 L -7.5,-16.5 Z'),
    earR: mkPath('M 7.5,-16.5 L 9,-21 L 10.5,-16.5 Z'),
    beak: mkPath('M 0,-6 L -1.5,-3 L 0,-1.5 L 1.5,-3 Z'),
    wingFeatherL1: mkPath('M -10.5,4.5 Q -13.5,7.5 -10.5,10.5'),
    wingFeatherL2: mkPath('M -10.5,7.5 Q -13.5,10.5 -10.5,13.5'),
    wingFeatherR1: mkPath('M 10.5,4.5 Q 13.5,7.5 10.5,10.5'),
    wingFeatherR2: mkPath('M 10.5,7.5 Q 13.5,10.5 10.5,13.5'),
    talonsL: mkPath('M -5.4,23.1 L -6,24.9 M -4.5,23.4 L -4.5,25.5 M -3.6,23.1 L -3,24.9'),
    talonsR: mkPath('M 3.6,23.1 L 3,24.9 M 4.5,23.4 L 4.5,25.5 M 5.4,23.1 L 6,24.9'),
  }), []);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scaleX: s }]}>
      <Oval x={-15} y={-13.5} width={30} height={36} color={C.body} />
      <Circle cx={0} cy={-7.5} r={13.5} color={C.body} />
      <Path path={paths.earL} color={C.bodyDk} />
      <Path path={paths.earR} color={C.bodyDk} />
      <Circle cx={0} cy={-7.5} r={10.5} color={C.face} />
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
      <Path path={paths.beak} color={C.gold} />
      <Oval x={-16.5} y={-3} width={12} height={21} color={C.bodyDk} />
      <Oval x={4.5} y={-3} width={12} height={21} color={C.bodyDk} />
      <Path path={paths.wingFeatherL1} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherL2} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherR1} style="stroke" color={C.body} strokeWidth={0.6} />
      <Path path={paths.wingFeatherR2} style="stroke" color={C.body} strokeWidth={0.6} />
      <Oval x={-7.5} y={0} width={15} height={18} color={C.face} />
      <Oval x={-6.9} y={17.4} width={4.8} height={7.2} color={C.gold} />
      <Oval x={2.1} y={17.4} width={4.8} height={7.2} color={C.gold} />
      <Path path={paths.talonsL} style="stroke" color={C.bodyDk} strokeWidth={0.6} strokeCap="round" />
      <Path path={paths.talonsR} style="stroke" color={C.bodyDk} strokeWidth={0.6} strokeCap="round" />
    </Group>
  );
}

export function BirdComponent({ x, y, flip, bobTransform }: { x: number; y: number; flip: boolean; bobTransform: any }) {
  const s = flip ? -1 : 1;
  const B = P.bird;
  const paths = useMemo(() => ({
    tail: mkPath('M -5,4 L -14,1 L -13,5 L -12,2 L -11,6 L -5,5 Z'),
    body: mkPath('M 0,0 C -5,-1 -7,2 -6,7 C -5,9 -2,10 0,10 C 2,10 5,9 6,7 C 7,2 5,-1 0,0 Z'),
    belly: mkPath('M -3,5 C -3,7 0,9 3,5 Z'),
    wing: mkPath('M -3,1 Q 0,-2 5,0 Q 6,3 4,6 Q 1,8 -2,5 Z'),
    beak: mkPath('M 6,3 L 10,3.5 L 6,5'),
    wingLine1: mkPath('M -1,2 Q 1,0 4,1.5'),
    wingLine2: mkPath('M -1,3.5 Q 1.5,2 5,3'),
    legsL: mkPath('M 0,9 L -1,13 L -2.5,13.5 M -1,13 L 0.5,13.5'),
    legsR: mkPath('M 3,9 L 4,13 L 2.5,13.5 M 4,13 L 5.5,13.5'),
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

export function SquirrelComponent({ x, y, flip, tailTransform }: { x: number; y: number; flip: boolean; tailTransform: any }) {
  const s = flip ? -1 : 1;
  const S = P.squirrel;
  const paths = useMemo(() => ({
    tail: mkPath('M -3,6 C -10,3 -15,-5 -10,-12 C -7,-16 -2,-14 -1,-9 C 0,-5 -1,0 -3,4 Z'),
    tailLight: mkPath('M -3,5 C -9,2 -13,-4 -9,-10 C -7,-14 -3,-12 -2,-8 C -1,-4 -1,1 -3,4 Z'),
    tailFur1: mkPath('M -5,2 Q -8,-2 -8,-6'),
    tailFur2: mkPath('M -4,0 Q -6,-4 -5,-9'),
    body: mkPath('M 0,2 C -5,0 -7,4 -6,12 C -5,15 -2,16 0,16 C 2,16 5,15 6,12 C 7,4 5,0 0,2 Z'),
    belly: mkPath('M -3.5,7 C -3.5,11 0,14 3.5,7 Z'),
    bellyLine1: mkPath('M -1,5 Q 1,6 3,5'),
    bellyLine2: mkPath('M -1.5,8 Q 1,9 3.5,8'),
    paw: mkPath('M 3,7 Q 5,6 6,8 Q 5,9 3,9 Z'),
    earL: mkPath('M 3,-7 L 2,-13 Q 4,-11 5,-7 Z'),
    earR: mkPath('M 9,-7 L 10,-13 Q 8,-11 7,-7 Z'),
    earInL: mkPath('M 3.5,-7 L 2.8,-11 Q 4,-10 4.5,-7 Z'),
    earInR: mkPath('M 8.5,-7 L 9.2,-11 Q 8,-10 7.5,-7 Z'),
    whiskers: mkPath('M 10.5,-2.5 L 14,-3.5 M 10.5,-2 L 14,-1.5 M 10.5,-1.5 L 13,0'),
    footL: mkPath('M -2,15 Q -4,16 -5,15.5 Q -4,17 -1,16.5 Z'),
    footR: mkPath('M 4,15 Q 6,16 7,15.5 Q 6,17 3,16.5 Z'),
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
