import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';
import type { DeliveryOrderPayload } from '@/services/api/delivery.api';
import { formatDeliveryCurrency } from './formatDeliveryCurrency';

function formatWhen(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

/** Completed delivery, styled like the restaurant dashboard's recent order card. */
export default function DeliveryHistoryRow({ order }: { order: DeliveryOrderPayload }) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const tint = ORDER_STATUS_COLORS.Delivered;
  const when = formatWhen(order.completedAt);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name} numberOfLines={1}>
          {order.restaurant?.name ?? 'Restaurant'}
        </Text>
        <Text style={styles.amount}>+{formatDeliveryCurrency(order.driverEarnings ?? order.estPayout)}</Text>
      </View>
      <View style={styles.foot}>
        {/* Only the long order number shrinks; the time and badge always stay whole */}
        <Text style={[styles.meta, styles.orderNumber]} numberOfLines={1} ellipsizeMode="middle">
          #{order.orderNumber}
        </Text>
        {when ? (
          <Text style={[styles.meta, styles.fixed]} numberOfLines={1}>
            •  {when}
          </Text>
        ) : null}
        <View style={[styles.badge, { backgroundColor: `${tint}20` }]}>
          <Text style={[styles.badgeText, { color: tint }]}>Delivered</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 6,
    },
    name: {
      flex: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    amount: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    foot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    meta: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    orderNumber: {
      flex: 1,
      minWidth: 0,
    },
    fixed: {
      flexShrink: 0,
    },
    badge: {
      flexShrink: 0,
      marginLeft: 'auto',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      textTransform: 'uppercase',
    },
  });
}
