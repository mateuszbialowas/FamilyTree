import React, { useEffect } from 'react';
import { Path, type PathProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedSvgPath = Animated.createAnimatedComponent(
  Path as React.ComponentClass<PathProps & { pathLength?: number }>
);

type Props = {
  d: string;
  stroke: string;
  fill: string;
  strokeWidth?: number;
  delay?: number;
  drawDuration?: number;
  fillDelay?: number;
  fillDuration?: number;
};

export function AnimatedPath({
  d,
  stroke,
  fill,
  strokeWidth = 2,
  delay = 0,
  drawDuration = 800,
  fillDelay = 1800,
  fillDuration = 500,
}: Props) {
  const dashOffset = useSharedValue(1);
  const fillOpacity = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withDelay(
      delay,
      withTiming(0, { duration: drawDuration, easing: Easing.inOut(Easing.ease) })
    );
    fillOpacity.value = withDelay(
      fillDelay,
      withTiming(1, { duration: fillDuration, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
    fillOpacity: fillOpacity.value,
  }));

  return (
    <AnimatedSvgPath
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      pathLength={1}
      strokeDasharray="1"
      animatedProps={animatedProps}
    />
  );
}
