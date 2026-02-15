import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius = 4 }: SkeletonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.5, { duration: 1000 }), -1, true),
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius,
          backgroundColor: '#E9ECEF',
        },
        animatedStyle,
      ]}
    />
  );
}
