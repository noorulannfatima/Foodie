import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { OrderItem } from '@/stores/restaurantStore';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';
import { formatRestaurantCurrency, getOrderTimeAgo } from '@/components/pages/restaurant/shared/orderUtils';
import { NEXT_STATUS } from './constants';

export interface RestaurantOrderCardProps {
  order: OrderItem;
  onPress: () => void;
  onDecline: (orderId: string) => void;
  onAdvance: (orderId: string, newStatus: string) => void;
}

function statusIcon(status: string): ComponentProps<typeof Ionicons>['name'] {
  if (status === 'Pending') return 'diamond-outline';
  if (status === 'Preparing') return 'time-outline';
  return 'checkmark-circle-outline';
}

export default function RestaurantOrderCard({
  order,
  onPress,
  onDecline,
  onAdvance,
}: RestaurantOrderCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const statusColor = ORDER_STATUS_COLORS[order.status] || c.muted;
  const next = NEXT_STATUS[order.status];

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={[styles.orderStatusBar, { backgroundColor: statusColor }]} />
      <View style={styles.orderCardBody}>
        <View style={styles.orderCardHeader}>
          <View style={styles.orderIdRow}>
            <Ionicons name={statusIcon(order.status)} size={20} color={statusColor} />
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {order.status === 'Delivered' ? 'Completed' : order.status}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>{order.customer?.name ?? 'Customer'}</Text>
        <View style={styles.orderMeta}>
          <Text style={styles.metaText}>{order.items.length} Items</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaPrice}>{formatRestaurantCurrency(order.pricing.total)}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text
            style={[
              styles.metaTime,
              { color: order.status === 'Pending' ? c.primary : c.muted },
            ]}
          >
            {getOrderTimeAgo(order.createdAt)}
          </Text>
        </View>

        {next ? (
          <View style={styles.actionRow}>
            {order.status === 'Pending' ? (
              <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(order._id)}>
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.acceptBtn, order.status !== 'Pending' && styles.acceptBtnFull]}
              onPress={() => onAdvance(order._id, next.status)}
            >
              <Text style={styles.acceptBtnText}>{next.label}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    orderCard: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.text,
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
      color: c.text,
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
      color: c.muted,
    },
    metaDot: {
      color: c.muted,
    },
    metaPrice: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.text,
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
      borderColor: c.primary,
      alignItems: 'center',
    },
    declineBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.primary,
    },
    acceptBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: c.primary,
      alignItems: 'center',
    },
    acceptBtnFull: {
      flex: 1,
    },
    acceptBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
  });
}
