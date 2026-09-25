import { View, StyleSheet } from 'react-native';
import { useRestaurantT } from '@/constants/restaurantStrings';
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
  const t = useRestaurantT();
  return (
    <View style={styles.statsBar}>
      <OrdersStatItem label={t('ordersStatActive')} value={activeCount} icon="receipt-outline" />
      <OrdersStatItem label={t('ordersStatPreparing')} value={preparingCount} icon="flame-outline" />
      <OrdersStatItem label={t('ordersStatReady')} value={readyCount} icon="bag-check-outline" />
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
