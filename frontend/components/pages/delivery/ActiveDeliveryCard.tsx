import { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import type { DeliveryOrderPayload } from '@/services/api/delivery.api';
import { formatDeliveryCurrency } from './formatDeliveryCurrency';
import { getDeliveryStep } from './deliveryStatus';

export interface ActiveDeliveryCardProps {
  order: DeliveryOrderPayload;
  busy: boolean;
  onAdvance: () => void;
  onNavigate: (address: string) => void;
}

export default function ActiveDeliveryCard({ order, busy, onAdvance, onNavigate }: ActiveDeliveryCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const step = getDeliveryStep(order.status);

  const pickup = order.restaurant?.addressLine ?? '';
  const drop = order.deliveryAddress
    ? [order.deliveryAddress.street, order.deliveryAddress.city].filter(Boolean).join(', ')
    : '';
  const target = step.headingToCustomer ? drop : pickup;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: `${step.tint}20` }]}>
          <Text style={[styles.badgeText, { color: step.tint }]}>{step.label}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <Stop
          styles={styles}
          c={c}
          icon="storefront-outline"
          label="Pickup"
          title={order.restaurant?.name ?? 'Restaurant'}
          detail={pickup}
          active={!step.headingToCustomer}
        />
        <View style={styles.routeLine} />
        <Stop
          styles={styles}
          c={c}
          icon="home-outline"
          label="Drop-off"
          title={drop || 'Customer address'}
          active={step.headingToCustomer}
        />
      </View>

      <View style={styles.itemsRow}>
        <Text style={styles.items} numberOfLines={2}>
          {order.itemsSummary}
        </Text>
        <Text style={styles.payout}>{formatDeliveryCurrency(order.driverEarnings ?? order.estPayout)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
          onPress={() => onNavigate(target)}
          disabled={!target}
          accessibilityRole="button"
          accessibilityLabel={step.headingToCustomer ? 'Navigate to drop-off' : 'Navigate to pickup'}
        >
          <Ionicons name="navigate-outline" size={18} color={c.text} />
          <Text style={styles.navText}>Navigate</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && styles.pressed]}
          onPress={onAdvance}
          disabled={busy || !step.next}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{step.actionLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Stop({
  styles,
  c,
  icon,
  label,
  title,
  detail,
  active,
}: {
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
  icon: 'storefront-outline' | 'home-outline';
  label: string;
  title: string;
  detail?: string;
  active: boolean;
}) {
  return (
    <View style={styles.stop}>
      <View style={[styles.stopIcon, active && styles.stopIconActive]}>
        <Ionicons name={icon} size={16} color={active ? '#fff' : c.muted} />
      </View>
      <View style={styles.stopBody}>
        <Text style={styles.stopLabel}>{label}</Text>
        <Text style={styles.stopTitle} numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text style={styles.stopDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
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
    },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    orderNumber: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
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
    route: {
      marginBottom: 14,
    },
    routeLine: {
      width: 2,
      height: 14,
      marginLeft: 15,
      marginVertical: 2,
      backgroundColor: c.border,
    },
    stop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stopIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.screenBackground,
      borderWidth: 1,
      borderColor: c.border,
    },
    stopIconActive: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    stopBody: {
      flex: 1,
    },
    stopLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    stopTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    stopDetail: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
    itemsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    items: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      lineHeight: 18,
    },
    payout: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 16,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    navText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
    },
    primaryBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
    },
    primaryText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: '#fff',
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
