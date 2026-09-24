import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DeliveryEarningsCardProps {
  label: string;
  amount: string;
  footnote: string;
  footnoteIcon?: ComponentProps<typeof Ionicons>['name'];
}

/** Brand-red headline card; the delivery twin of the restaurant revenue card. */
export default function DeliveryEarningsCard({
  label,
  amount,
  footnote,
  footnoteIcon = 'bicycle-outline',
}: DeliveryEarningsCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${amount}. ${footnote}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
        {amount}
      </Text>
      <View style={styles.subRow}>
        <Ionicons name={footnoteIcon} size={18} color="rgba(255,255,255,0.85)" />
        <Text style={styles.subText}>{footnote}</Text>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.secondary,
      borderRadius: 16,
      padding: 24,
      marginBottom: 12,
    },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: 1,
      marginBottom: 8,
    },
    amount: {
      fontFamily: Fonts.brandBlack,
      fontSize: 36,
      color: '#fff',
      marginBottom: 12,
      fontVariant: ['tabular-nums'],
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    subText: {
      flexShrink: 1,
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
    },
  });
}
