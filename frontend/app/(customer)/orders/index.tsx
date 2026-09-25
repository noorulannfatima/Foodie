import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { customerAPI } from '@/services/api/customer.api';
import ReviewModal from '@/components/organisms/Modals/ReviewModal';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import CustomerScreenHeader from '@/components/pages/customer/CustomerScreenHeader';

interface OrderListItem {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  pricing: { total: number };
  items: Array<{ menuItem: string; name: string; quantity: number; price: number }>;
  restaurant?: { name?: string; logo?: string };
  deliveryPerson?: { name?: string } | null;
  isReviewed: boolean;
}

function statusTone(status: string, c: AppColors): { bg: string; fg: string } {
  switch (status) {
    case 'Delivered':
      return { bg: '#DCFCE7', fg: '#15803D' };
    case 'Cancelled':
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    case 'OutForDelivery':
    case 'PickedUp':
    case 'Ready':
      return { bg: '#FEF3C7', fg: '#92400E' };
    default:
      return { bg: c.primaryLight, fg: c.navBar };
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPKR(value: number) {
  return `Rs. ${value.toFixed(0)}`;
}

export default function OrderHistoryScreen() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<OrderListItem | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const res = (await customerAPI.getOrders()) as { orders: OrderListItem[] };
      setOrders(res.orders ?? []);
      setError(null);
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fade]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    fade.setValue(0);
    load();
  };

  const onReviewSubmitted = () => {
    const reviewedId = reviewing?._id;
    setReviewing(null);
    setOrders((prev) => prev.map((o) => (o._id === reviewedId ? { ...o, isReviewed: true } : o)));
  };

  const renderItem = ({ item }: { item: OrderListItem }) => {
    const tone = statusTone(item.status, c);
    const itemSummary = item.items
      .slice(0, 3)
      .map((i) => `${i.quantity}× ${i.name}`)
      .join(', ');
    const more = item.items.length > 3 ? ` +${item.items.length - 3} more` : '';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => router.push({ pathname: '/(customer)/order/[id]', params: { id: item._id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.restaurant} numberOfLines={1}>
          {item.restaurant?.name ?? 'Restaurant'}
        </Text>
        <Text style={styles.itemsLine} numberOfLines={2}>
          {itemSummary}
          {more}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.totalText}>{formatPKR(item.pricing.total)}</Text>
        </View>

        {item.status === 'Delivered' ? (
          <View style={styles.reviewRow}>
            {item.isReviewed ? (
              <View style={styles.reviewedChip}>
                <Ionicons name="star" size={12} color="#15803D" />
                <Text style={styles.reviewedChipText}>Reviewed</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => setReviewing(item)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="star-outline" size={14} color={c.primary} />
                <Text style={styles.rateBtnText}>Rate</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CustomerScreenHeader title="Order History" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={c.muted} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={40} color={c.muted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your past orders will appear here.</Text>
        </View>
      ) : (
        <Animated.View style={[styles.listWrap, { opacity: fade }]}>
          <FlatList
            data={orders}
            keyExtractor={(o) => o._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
            }
          />
        </Animated.View>
      )}

      <ReviewModal
        visible={!!reviewing}
        order={reviewing}
        onClose={() => setReviewing(null)}
        onSubmitted={onReviewSubmitted}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.customerBodyBg },
    listWrap: { flex: 1, backgroundColor: c.customerBodyBg },
    listContent: { padding: 16, paddingBottom: 32 },
    card: {
      backgroundColor: c.customerSurface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    orderNumber: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      letterSpacing: 0.5,
    },
    restaurant: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.text,
      marginBottom: 4,
    },
    itemsLine: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateText: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
    totalText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    reviewRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    rateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.primary,
    },
    rateBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.primary,
    },
    reviewedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: '#DCFCE7',
    },
    reviewedChipText: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: '#15803D',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.customerBodyBg,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
      marginTop: 8,
    },
    emptyText: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 12,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.secondary,
    },
    retryBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: '#fff',
    },
  });
}
