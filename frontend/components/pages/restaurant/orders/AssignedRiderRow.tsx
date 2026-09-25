import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useRestaurantT } from '@/constants/restaurantStrings';
import type { OrderItem } from '@/stores/restaurantStore';

/** Statuses where the kitchen is waiting for a rider to claim the order. */
const AWAITING_RIDER = ['Confirmed', 'Preparing', 'Ready'];

export interface AssignedRiderRowProps {
  order: OrderItem;
  /** `compact` is a one-line hint for the order card; `full` is the detail section with a Call button. */
  variant: 'compact' | 'full';
}

/** Who is collecting this order, or that nobody has claimed it yet. */
export default function AssignedRiderRow({ order, variant }: AssignedRiderRowProps) {
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const styles = useMemo(() => createStyles(c), [c]);
  const rider = order.deliveryPerson;

  if (!rider) {
    if (!AWAITING_RIDER.includes(order.status)) return null;
    return (
      <View style={variant === 'full' ? styles.section : styles.compactRow}>
        {variant === 'full' ? <Text style={styles.label}>{t('ordersRiderLabel')}</Text> : null}
        <View style={styles.inline}>
          <Ionicons name="hourglass-outline" size={14} color={c.muted} />
          <Text style={styles.muted}>{t('ordersRiderWaiting')}</Text>
        </View>
      </View>
    );
  }

  const vehicle = rider.vehicle ? `${rider.vehicle.type} · ${rider.vehicle.plateNumber}` : '';

  if (variant === 'compact') {
    return (
      <View style={[styles.compactRow, styles.inline]}>
        <Ionicons name="bicycle-outline" size={14} color={c.muted} />
        <Text style={styles.muted} numberOfLines={1}>
          {vehicle ? `${rider.name} · ${vehicle}` : rider.name}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('ordersRiderLabel')}</Text>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{rider.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {rider.name}
          </Text>
          {vehicle ? <Text style={styles.muted}>{vehicle}</Text> : null}
        </View>
        {rider.phone ? (
          <Pressable
            style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
            onPress={() => Linking.openURL(`tel:${rider.phone!.replace(/[^\d+]/g, '')}`)}
            accessibilityRole="button"
            accessibilityLabel={t('ordersRiderCall')}
            hitSlop={4}
          >
            <Ionicons name="call-outline" size={18} color={c.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    section: { marginBottom: 24 },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 8,
    },
    compactRow: { marginTop: 6 },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    muted: { flexShrink: 1, fontFamily: Fonts.brand, fontSize: 13, color: c.muted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.brand,
      justifyContent: 'center',
      alignItems: 'center',
    },
    initial: { fontFamily: Fonts.brandBold, fontSize: 16, color: '#fff' },
    body: { flex: 1 },
    name: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    callBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
  });
}
