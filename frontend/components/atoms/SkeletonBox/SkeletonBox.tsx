import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export default function SkeletonBox({
    width,
    height,
    borderRadius = 8,
    style,
}: SkeletonBoxProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 0.85],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width: width as any, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#CBD5E1',
    },
});