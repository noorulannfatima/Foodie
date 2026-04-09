import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface OrdersStatItemProps {
  label: string;
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export default function OrdersStatItem({ label, value, icon }: OrdersStatItemProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.statsItem}>
      <Text style={styles.statsLabel}>{label}</Text>
      <View style={styles.statsValueRow}>
        <Text style={styles.statsValue}>{value}</Text>
        <Ionicons name={icon} size={20} color={c.secondary} />
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    statsItem: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    statsLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 10,
      color: c.muted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    statsValueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 24,
      color: c.text,
    },
  });
}
