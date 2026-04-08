import { View, StyleSheet } from 'react-native';
import OrdersStatItem from './OrdersStatItem';

export interface RestaurantOrdersStatsBarProps {
  activeCount: number;
  preparingCount: number;
  readyCount: number;
}

export default function RestaurantOrdersStatsBar({
  activeCount,
  preparingCount,
  readyCount,
}: RestaurantOrdersStatsBarProps) {
  return (
    <View style={styles.statsBar}>
      <OrdersStatItem label="ACTIVE ORDERS" value={activeCount} icon="receipt-outline" />
      <OrdersStatItem label="IN PREPARATION" value={preparingCount} icon="flame-outline" />
      <OrdersStatItem label="READY FOR PICKUP" value={readyCount} icon="bag-check-outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
});
