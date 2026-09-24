import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DeliverySegmentedTabsProps<K extends string> {
  tabs: { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
}

/** Sliding brand pill segmented control, same as the restaurant profile tab bar. */
export default function DeliverySegmentedTabs<K extends string>({
  tabs,
  active,
  onChange,
}: DeliverySegmentedTabsProps<K>) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === active));
  const anim = useRef(new Animated.Value(activeIndex)).current;
  // Percentage translateX isn't reliable in RN; measure and move by whole segments.
  // The -2 accounts for the 1pt border.
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeIndex, anim]);

  return (
    <View
      style={styles.bar}
      accessibilityRole="tablist"
      onLayout={(e) => setSegmentWidth((e.nativeEvent.layout.width - 2) / tabs.length)}
    >
      {segmentWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: segmentWidth - 8, transform: [{ translateX: Animated.multiply(anim, segmentWidth) }] },
          ]}
        />
      )}
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      overflow: 'hidden',
      height: 44,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.muted,
    },
    labelActive: {
      color: '#fff',
    },
    indicator: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 9,
      backgroundColor: c.brand,
    },
  });
}
