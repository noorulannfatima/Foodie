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
    <View style={styles.priceCard}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Subtotal</Text>
        <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Delivery Fee</Text>
        <Text style={styles.priceValue}>{formatCurrency(deliveryFee)}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Taxes & Fees</Text>
        <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
      </View>
      <View style={styles.priceDivider} />
      <View style={styles.priceRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    priceCard: {
      backgroundColor: c.isDark ? c.card : '#F8F9FA',
      borderRadius: 16,
      padding: 20,
      marginTop: 24,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.border,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    priceLabel: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    priceValue: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
    },
    priceDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
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
      color: c.primary,
    },
  });
}
