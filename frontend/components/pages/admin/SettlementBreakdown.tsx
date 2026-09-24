import { View, Text } from 'react-native';
import type { Settlement } from '@/services/api/admin.types';
import { formatPKR } from './format';
import { useAdminStyles } from './useAdminStyles';

interface SettlementBreakdownProps {
  settlement: Settlement;
  commissionRate: number;
}

/** Gross → deductions → net, the way restaurants reconcile their payout. */
export default function SettlementBreakdown({ settlement, commissionRate }: SettlementBreakdownProps) {
  const { styles } = useAdminStyles();
  const owes = settlement.netAmount < 0;

  const rows: [string, string][] = [
    ['Online sales', formatPKR(settlement.onlineSales)],
    ['Cash sales (kept by restaurant)', formatPKR(settlement.cashSales)],
    [`Commission (${Math.round(commissionRate * 1000) / 10}% of ${formatPKR(settlement.grossSales)})`, `−${formatPKR(settlement.commission)}`],
    ['Online payment fees', `−${formatPKR(settlement.paymentFees)}`],
  ];

  return (
    <View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { flexShrink: 1 }]}>{label}</Text>
          <Text style={styles.breakdownValue}>{value}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.breakdownRow}>
        <Text style={styles.totalLabel}>{owes ? 'Restaurant owes Foodie' : 'Pay to restaurant'}</Text>
        <Text style={[styles.totalValue, owes && styles.negative]}>
          {formatPKR(Math.abs(settlement.netAmount))}
        </Text>
      </View>
    </View>
  );
}
