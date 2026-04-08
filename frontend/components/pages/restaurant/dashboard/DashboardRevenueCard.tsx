import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface DashboardRevenueCardProps {
  totalRevenue: number;
  totalOrders: number;
  formatCurrency: (amount: number) => string;
}

export default function DashboardRevenueCard({
  totalRevenue,
  totalOrders,
  formatCurrency,
}: DashboardRevenueCardProps) {
  return (
    <View style={styles.revenueCard}>
      <Text style={styles.revenueLabel}>TODAY'S REVENUE</Text>
      <Text style={styles.revenueAmount}>{formatCurrency(totalRevenue)}</Text>
      <View style={styles.revenueSubRow}>
        <Ionicons name="trending-up" size={18} color="#fff" />
        <Text style={styles.revenueSubText}>{totalOrders} orders today</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  revenueCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  revenueLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  revenueAmount: {
    fontFamily: Fonts.brandBlack,
    fontSize: 36,
    color: '#fff',
    marginBottom: 12,
  },
  revenueSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revenueSubText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
