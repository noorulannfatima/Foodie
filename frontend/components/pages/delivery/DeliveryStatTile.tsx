import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DeliveryStatTileProps {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Makes the tile a button (e.g. rating opens the ratings list). */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Small bordered stat, matching the restaurant orders stat bar. */
export default function DeliveryStatTile({
  label,
  value,
  icon,
  onPress,
  accessibilityLabel,
}: DeliveryStatTileProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const body = (
    <>
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={12} color={c.muted} /> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Ionicons name={icon} size={20} color={c.primary} />
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.tile} accessible accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: {
      opacity: 0.7,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      marginBottom: 6,
    },
    label: {
      flexShrink: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 10,
      color: c.muted,
      letterSpacing: 0.5,
    },
    valueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 4,
    },
    value: {
      flexShrink: 1,
      fontFamily: Fonts.brandBlack,
      fontSize: 22,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
  });
}
