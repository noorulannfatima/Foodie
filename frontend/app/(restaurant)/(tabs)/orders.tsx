import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { useRestaurantStore, OrderItem } from '@/stores/restaurantStore';
import { Loader } from '@/components/atoms';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'];

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Confirmed: '#3B82F6',
  Preparing: '#8B5CF6',
  Ready: '#10B981',
  PickedUp: '#06B6D4',
  Delivered: '#22C55E',
  Cancelled: '#EF4444',
};

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  Pending: { label: 'Accept Order', status: 'Confirmed' },
  Confirmed: { label: 'Start Preparing', status: 'Preparing' },
  Preparing: { label: 'Mark Ready', status: 'Ready' },
};

export default function RestaurantOrders() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { orders, ordersLoading, fetchOrders, updateOrderStatus } = useRestaurantStore();

  useEffect(() => {
    loadOrders();
  }, [activeFilter]);

  const loadOrders = () => {
    const params: { status?: string } = {};
    if (activeFilter !== 'All') {
      params.status = activeFilter === 'Completed' ? 'Delivered' : activeFilter;
    }
    fetchOrders(params);
  };

  const onRefresh = useCallback(() => {
    loadOrders();
  }, [activeFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order status');
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

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const openDetail = (order: OrderItem) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={20} color={Colors.primary} />
          <Text style={styles.brand}>FOODIE</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <StatsItem label="ACTIVE ORDERS" value={orders.filter((o) => ['Pending', 'Confirmed', 'Preparing', 'Ready'].includes(o.status)).length} icon="receipt-outline" />
        <StatsItem label="IN PREPARATION" value={orders.filter((o) => o.status === 'Preparing').length} icon="flame-outline" />
        <StatsItem label="READY FOR PICKUP" value={orders.filter((o) => o.status === 'Ready').length} icon="bag-check-outline" />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.pipelineTitle}>Order Pipeline</Text>

      {/* Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ordersLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.ordersList}
      >
        {ordersLoading && orders.length === 0 ? (
          <View style={styles.loadingWrap}><Loader /></View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.light} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'All' ? 'Orders will appear here when customers place them.' : `No ${activeFilter.toLowerCase()} orders right now.`}
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order._id} style={styles.orderCard} onPress={() => openDetail(order)}>
              <View style={[styles.orderStatusBar, { backgroundColor: STATUS_COLORS[order.status] || Colors.muted }]} />
              <View style={styles.orderCardBody}>
                <View style={styles.orderCardHeader}>
                  <View style={styles.orderIdRow}>
                    <Ionicons
                      name={order.status === 'Pending' ? 'diamond-outline' : order.status === 'Preparing' ? 'time-outline' : 'checkmark-circle-outline'}
                      size={20}
                      color={STATUS_COLORS[order.status] || Colors.muted}
                    />
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || Colors.muted) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[order.status] || Colors.muted }]}>
                      {order.status === 'Delivered' ? 'Completed' : order.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{order.customer?.name ?? 'Customer'}</Text>
                <View style={styles.orderMeta}>
                  <Text style={styles.metaText}>{order.items.length} Items</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaPrice}>{formatCurrency(order.pricing.total)}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={[styles.metaTime, { color: order.status === 'Pending' ? Colors.primary : Colors.muted }]}>
                    {getTimeAgo(order.createdAt)}
                  </Text>
                </View>

                {NEXT_STATUS[order.status] && (
                  <View style={styles.actionRow}>
                    {order.status === 'Pending' && (
                      <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(order._id)}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.acceptBtn, order.status !== 'Pending' && { flex: 1 }]}
                      onPress={() => handleStatusUpdate(order._id, NEXT_STATUS[order.status].status)}
                    >
                      <Text style={styles.acceptBtnText}>{NEXT_STATUS[order.status].label}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet">
        <OrderDetailModal order={selectedOrder} onClose={() => setDetailVisible(false)} onStatusUpdate={handleStatusUpdate} />
      </Modal>
    </View>
  );
}

function StatsItem({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={styles.statsItem}>
      <Text style={styles.statsLabel}>{label}</Text>
      <View style={styles.statsValueRow}>
        <Text style={styles.statsValue}>{value}</Text>
        <Ionicons name={icon as any} size={20} color={Colors.secondary} />
      </View>
    </View>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
}: {
  order: OrderItem | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}) {
  if (!order) return null;

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const nextAction = NEXT_STATUS[order.status];

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.modalContent}>
        {/* Status */}
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>STATUS</Text>
          <View style={[styles.statusBadgeLg, { backgroundColor: (STATUS_COLORS[order.status] || Colors.muted) + '20' }]}>
            <Text style={[styles.statusBadgeLgText, { color: STATUS_COLORS[order.status] || Colors.muted }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.modalSection}>
          <View style={styles.modalSectionHeader}>
            <Text style={styles.modalSectionLabel}>ORDER ITEMS</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{order.items.length} ITEMS</Text>
            </View>
          </View>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.modalItem}>
              <View style={styles.modalItemInfo}>
                <Text style={styles.modalItemName}>{item.name}</Text>
                {item.specialInstructions && (
                  <Text style={styles.modalItemNote}>{item.specialInstructions}</Text>
                )}
                <Text style={styles.modalItemQty}>QTY: {item.quantity}</Text>
              </View>
              <Text style={styles.modalItemPrice}>{formatCurrency(item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.modalSection}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>{formatCurrency(order.pricing.subtotal)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Delivery Fee</Text>
            <Text style={styles.pricingValue}>{formatCurrency(order.pricing.deliveryFee)}</Text>
          </View>
          {order.pricing.tax > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Tax</Text>
              <Text style={styles.pricingValue}>{formatCurrency(order.pricing.tax)}</Text>
            </View>
          )}
          <View style={styles.pricingDivider} />
          <View style={styles.pricingRow}>
            <Text style={styles.pricingTotal}>TOTAL</Text>
            <Text style={styles.pricingTotalValue}>{formatCurrency(order.pricing.total)}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>CUSTOMER</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>
                {order.customer?.name?.[0]?.toUpperCase() ?? 'C'}
              </Text>
            </View>
            <View>
              <Text style={styles.customerName2}>{order.customer?.name ?? 'Customer'}</Text>
              <Text style={styles.customerEmail}>{order.customer?.email ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>DELIVERY ADDRESS</Text>
          <Text style={styles.addressText}>
            {order.deliveryAddress.street}, {order.deliveryAddress.city} {order.deliveryAddress.zipCode}
          </Text>
          {order.deliveryAddress.instructions && (
            <View style={styles.driverNote}>
              <Text style={styles.driverNoteLabel}>DRIVER NOTE</Text>
              <Text style={styles.driverNoteText}>{order.deliveryAddress.instructions}</Text>
            </View>
          )}
        </View>

        {/* Action */}
        {nextAction && (
          <View style={styles.modalAction}>
            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                onStatusUpdate(order._id, nextAction.status);
                onClose();
              }}
            >
              <Text style={styles.modalActionBtnText}>{nextAction.label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statsItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statsLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statsValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 24,
    color: Colors.dark,
  },
  filterContainer: {
    maxHeight: 48,
    paddingLeft: 16,
  },
  filterContent: {
    gap: 8,
    paddingRight: 16,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  filterText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.muted,
  },
  filterTextActive: {
    color: '#fff',
  },
  pipelineTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.dark,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 250,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderStatusBar: {
    width: 4,
  },
  orderCardBody: {
    flex: 1,
    padding: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontFamily: Fonts.brandBlack,
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
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  metaDot: {
    color: Colors.muted,
  },
  metaPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.dark,
  },
  metaTime: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  declineBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 18,
    color: Colors.dark,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusBadgeLg: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeLgText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  itemCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  itemCountText: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalItemName: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 2,
  },
  modalItemNote: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  modalItemQty: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  modalItemPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  pricingValue: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.dark,
  },
  pricingDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: '#E0E0E0',
    marginVertical: 8,
  },
  pricingTotal: {
    fontFamily: Fonts.brandBlack,
    fontSize: 16,
    color: Colors.primary,
  },
  pricingTotalValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 16,
    color: Colors.primary,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
  customerName2: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: '#fff',
  },
  customerEmail: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  addressText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  driverNote: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  driverNoteLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: '#F59E0B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  driverNoteText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.text,
  },
  modalAction: {
    marginTop: 8,
  },
  modalActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalActionBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
});
