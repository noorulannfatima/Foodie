import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OrderItem } from '@/stores/restaurantStore';
import { Colors, Fonts } from '@/constants/theme';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/restaurant-shared/orderStatus';

export interface DashboardRecentOrderCardProps {
  order: OrderItem;
  formatCurrency: (amount: number) => string;
  timeAgo: string;
  onPress: () => void;
}

export default function DashboardRecentOrderCard({
  order,
  formatCurrency,
  timeAgo,
  onPress,
}: DashboardRecentOrderCardProps) {
  const c = ORDER_STATUS_COLORS[order.status] || Colors.muted;

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderCardHeader}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${c}20` }]}>
          <Text style={[styles.statusBadgeText, { color: c }]}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.orderCustomer}>{order.customer?.name ?? 'Customer'}</Text>
      <View style={styles.orderCardFooter}>
        <Text style={styles.orderItems}>{order.items.length} items</Text>
        <Text style={styles.orderDot}>•</Text>
        <Text style={styles.orderTotal}>{formatCurrency(order.pricing.total)}</Text>
        <Text style={styles.orderDot}>•</Text>
        <Text style={styles.orderTime}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  orderCustomer: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItems: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  orderDot: {
    color: Colors.muted,
    fontSize: 13,
  },
  orderTotal: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.dark,
  },
  orderTime: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.primary,
  },
});
