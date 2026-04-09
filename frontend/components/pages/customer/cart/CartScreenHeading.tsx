import { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface CartScreenHeadingProps {
  restaurantName?: string;
}

export default function CartScreenHeading({ restaurantName }: CartScreenHeadingProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <>
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.restaurantLabel}>from {restaurantName ?? '—'}</Text>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
      marginBottom: 4,
    },
    restaurantLabel: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      marginBottom: 20,
    },
  });
}
