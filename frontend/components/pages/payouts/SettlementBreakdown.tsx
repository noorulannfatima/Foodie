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
  /** Overrides the English wording, e.g. with translated text. */
  labels?: Partial<SettlementBreakdownLabels>;
}

export interface SettlementBreakdownLabels {
  onlineSales: string;
  cashSales: string;
  /** Receives the formatted rate and gross sales. */
  commission: (rate: string, gross: string) => string;
  paymentFees: string;
  /** Total when the net amount is negative. */
  owes: string;
  /** Total when the net amount is positive. */
  receives: string;
}

const ENGLISH: Record<SettlementBreakdownProps['perspective'], SettlementBreakdownLabels> = {
  admin: {
    onlineSales: 'Online sales',
    cashSales: 'Cash sales (kept by restaurant)',
    commission: (rate, gross) => `Commission (${rate} of ${gross})`,
    paymentFees: 'Online payment fees',
    owes: 'Restaurant owes Foodie',
    receives: 'Pay to restaurant',
  },
  restaurant: {
    onlineSales: 'Online sales',
    cashSales: 'Cash sales (already with you)',
    commission: (rate, gross) => `Commission (${rate} of ${gross})`,
    paymentFees: 'Online payment fees',
    owes: 'You owe Foodie',
    receives: 'Foodie pays you',
  },
};

const NEGATIVE = '#DC2626';

/** Gross → deductions → net, the way restaurants reconcile their payout. */
export default function SettlementBreakdown({
  settlement,
  commissionRate,
  perspective,
  labels,
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
  const l = { ...ENGLISH[perspective], ...labels };
  const totalLabel = owes ? l.owes : l.receives;

  const rows: [string, string][] = [
    [l.onlineSales, formatPKR(settlement.onlineSales)],
    [l.cashSales, formatPKR(settlement.cashSales)],
    [
      l.commission(formatPercent(commissionRate), formatPKR(settlement.grossSales)),
      `−${formatPKR(settlement.commission)}`,
    ],
    [l.paymentFees, `−${formatPKR(settlement.paymentFees)}`],
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
