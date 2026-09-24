import { useMemo } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';
import type { DeliveryOrderPayload } from '@/services/api/delivery.api';
import { formatDeliveryCurrency } from './formatDeliveryCurrency';

export interface DeliveryRequestCardProps {
  order: DeliveryOrderPayload;
  accepting: boolean;
  disabled: boolean;
  onAccept: () => void;
}

export default function DeliveryRequestCard({ order, accepting, disabled, onAccept }: DeliveryRequestCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const ready = order.tag === 'HOT_ORDER';
  const tint = ready ? ORDER_STATUS_COLORS.Ready : ORDER_STATUS_COLORS.Preparing;
  const prep = order.prepMinutes ?? order.estimatedPreparationTime;
  const drop = [order.deliveryAddress?.street, order.deliveryAddress?.city].filter(Boolean).join(', ');

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.thumb}>
          {order.restaurant?.image ? (
            <Image source={{ uri: order.restaurant.image }} style={styles.thumbImg} />
          ) : (
            <Ionicons name="storefront-outline" size={22} color={c.muted} />
          )}
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.name} numberOfLines={1}>
            {order.restaurant?.name ?? 'Restaurant'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            #{order.orderNumber} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${tint}20` }]}>
          <Text style={[styles.badgeText, { color: tint }]}>
            {ready ? 'Ready now' : prep ? `${prep} min prep` : 'Preparing'}
          </Text>
        </View>
      </View>

      {drop ? (
        <View style={styles.dropRow}>
          <Ionicons name="location-outline" size={15} color={c.muted} />
          <Text style={styles.dropText} numberOfLines={1}>
            {drop}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View>
          <Text style={styles.payLabel}>You earn</Text>
          <Text style={styles.payValue}>{formatDeliveryCurrency(order.estPayout)}</Text>
        </View>
        <Pressable
          onPress={onAccept}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Accept order ${order.orderNumber} from ${order.restaurant?.name ?? 'restaurant'}`}
          style={({ pressed }) => [styles.accept, (pressed || disabled) && styles.dimmed]}
        >
          {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptText}>Accept</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 10,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.screenBackground,
    },
    thumbImg: {
      width: '100%',
      height: '100%',
    },
    titleCol: {
      flex: 1,
    },
    name: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    meta: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      textTransform: 'uppercase',
    },
    dropRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    dropText: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    payLabel: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
    payValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    accept: {
      minWidth: 112,
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brand,
    },
    acceptText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: '#fff',
    },
    dimmed: {
      opacity: 0.7,
    },
  });
}
