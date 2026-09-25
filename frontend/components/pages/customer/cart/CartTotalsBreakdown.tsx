import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface CartTotalsBreakdownProps {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  formatCurrency: (amount: number) => string;
}

export default function CartTotalsBreakdown({
  subtotal,
  deliveryFee,
  tax,
  total,
  formatCurrency,
}: CartTotalsBreakdownProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>ORDER SUMMARY</Text>
      <Row styles={styles} label="Subtotal" value={formatCurrency(subtotal)} />
      <Row styles={styles} label="Delivery fee" value={formatCurrency(deliveryFee)} />
      <Row styles={styles} label="Taxes & fees" value={formatCurrency(tax)} />
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

function Row({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginTop: 14,
    },
    heading: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingVertical: 5,
    },
    label: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    value: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 10,
    },
    totalLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
    },
    totalValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
  });
}
