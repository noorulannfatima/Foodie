import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurantStore, OrderItem } from '@/stores/restaurantStore';
import { Loader } from '@/components/atoms';
import {
  RestaurantOrdersHeader,
  RestaurantOrdersStatsBar,
  OrderStatusFilterRow,
  OrderPipelineTitle,
  RestaurantOrderCard,
  RestaurantOrdersEmptyState,
  OrderDetailModal,
} from '@/components/pages/restaurant/orders';

export default function RestaurantOrders() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { orders, ordersLoading, fetchOrders, updateOrderStatus } = useRestaurantStore();

  const loadOrders = useCallback(() => {
    const params: { status?: string } = {};
    if (activeFilter !== 'All') {
      params.status = activeFilter === 'Completed' ? 'Delivered' : activeFilter;
    }
    fetchOrders(params);
  }, [activeFilter, fetchOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      Alert.alert('Error', message);
    }
  };

  const handleDecline = (orderId: string) => {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Decline',
        style: 'destructive',
        onPress: () => handleStatusUpdate(orderId, 'Cancelled'),
      },
    ]);
  };

  const openDetail = (order: OrderItem) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const activeCount = orders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Ready'].includes(o.status)
  ).length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RestaurantOrdersHeader />
      <RestaurantOrdersStatsBar
        activeCount={activeCount}
        preparingCount={preparingCount}
        readyCount={readyCount}
      />
      <OrderStatusFilterRow activeFilter={activeFilter} onSelectFilter={setActiveFilter} />
      <OrderPipelineTitle />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ordersLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.ordersList}
      >
        {ordersLoading && orders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Loader />
          </View>
        ) : orders.length === 0 ? (
          <RestaurantOrdersEmptyState activeFilter={activeFilter} />
        ) : (
          orders.map((order) => (
            <RestaurantOrderCard
              key={order._id}
              order={order}
              onPress={() => openDetail(order)}
              onDecline={handleDecline}
              onAdvance={handleStatusUpdate}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet">
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setDetailVisible(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
