import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

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

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 7,
  },
  activeIconBox: {
    backgroundColor: Colors.primary,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.muted,
    textAlign: 'center',
  },
  activeLabel: {
    color: Colors.primary,
    fontFamily: Fonts.brandBold,
  },
});