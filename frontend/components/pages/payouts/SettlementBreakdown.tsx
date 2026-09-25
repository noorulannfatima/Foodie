import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import type { Settlement } from '@/services/api/payout.types';
import { formatPercent, formatPKR } from './format';

interface SettlementBreakdownProps {
  settlement: Settlement;
  commissionRate: number;
  /** Wording of the total: admins pay restaurants, restaurants receive from Foodie. */
  perspective: 'admin' | 'restaurant';
}

const NEGATIVE = '#DC2626';

/** Gross → deductions → net, the way restaurants reconcile their payout. */
export default function SettlementBreakdown({
  settlement,
  commissionRate,
  perspective,
}: SettlementBreakdownProps) {
  const c = useAppThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
        label: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted, flexShrink: 1 },
        value: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.text },
        divider: { height: 1, backgroundColor: c.border, marginVertical: 6 },
        totalLabel: { fontFamily: Fonts.brandBlack, fontSize: 15, color: c.text, flexShrink: 1 },
        totalValue: { fontFamily: Fonts.brandBlack, fontSize: 17, color: c.text },
      }),
    [c],
  );

  const owes = settlement.netAmount < 0;
  const cashLabel = perspective === 'admin' ? 'Cash sales (kept by restaurant)' : 'Cash sales (already with you)';
  const totalLabel =
    perspective === 'admin'
      ? owes
        ? 'Restaurant owes Foodie'
        : 'Pay to restaurant'
      : owes
        ? 'You owe Foodie'
        : 'Foodie pays you';

  const rows: [string, string][] = [
    ['Online sales', formatPKR(settlement.onlineSales)],
    [cashLabel, formatPKR(settlement.cashSales)],
    [
      `Commission (${formatPercent(commissionRate)} of ${formatPKR(settlement.grossSales)})`,
      `−${formatPKR(settlement.commission)}`,
    ],
    ['Online payment fees', `−${formatPKR(settlement.paymentFees)}`],
  ];

  return (
    <View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={[styles.totalValue, owes && { color: NEGATIVE }]}>
          {formatPKR(Math.abs(settlement.netAmount))}
        </Text>
      </View>
    </View>
  );
}
