import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

interface CategoryPillProps {
  id: string;
  label: string;
  emoji: string;
  isActive: boolean;
  onPress: (id: string) => void;
}

export default function CategoryPill({
  id,
  label,
  emoji,
  isActive,
  onPress,
}: CategoryPillProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const scaleRef = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleRef, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleRef, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
      <Pressable
        onPress={() => onPress(id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, isActive && styles.activeContainer]}
      >
        <View style={[styles.iconBox, isActive && styles.activeIconBox]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <Text style={[styles.label, isActive && styles.activeLabel]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      marginRight: 14,
      width: 70,
    },
    activeContainer: {},
    iconBox: {
      width: 62,
      height: 62,
      borderRadius: 18,
      backgroundColor: c.customerSurface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0.35 : 0.07,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: 7,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.customerBorder,
    },
    activeIconBox: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    emoji: {
      fontSize: 26,
    },
    label: {
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.muted,
      textAlign: 'center',
    },
    activeLabel: {
      color: c.primary,
      fontFamily: Fonts.brandBold,
    },
  });
}
