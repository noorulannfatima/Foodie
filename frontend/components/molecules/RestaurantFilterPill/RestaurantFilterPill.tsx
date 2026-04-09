import { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface RestaurantFilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function RestaurantFilterPill({ label, active, onPress }: RestaurantFilterPillProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  const activeBg = c.chromeDark;
  return StyleSheet.create({
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.customerSurface,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillActive: {
      backgroundColor: activeBg,
      borderColor: activeBg,
    },
    text: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.muted,
    },
    textActive: {
      color: '#fff',
    },
  });
}
