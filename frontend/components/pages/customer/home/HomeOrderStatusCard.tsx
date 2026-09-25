import { useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import type { ActiveOrder } from '@/services/api/customer.api';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';
import { ORDER_PHASES, phaseFor, phaseIndexFor } from '@/components/pages/customer/shared/orderPhases';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { orderStatusKey, type CustomerStringKey } from '@/constants/customerStrings';

const HEADLINES: Record<string, CustomerStringKey> = {
  Pending: 'orderHeadlinePending',
  Confirmed: 'orderHeadlineConfirmed',
  Preparing: 'orderHeadlinePreparing',
  Ready: 'orderHeadlineReady',
  PickedUp: 'orderHeadlinePickedUp',
  OutForDelivery: 'orderHeadlineOutForDelivery',
  Delivered: 'statusDelivered',
  Cancelled: 'orderCancelledTitle',
};

const BADGE_LABELS: Record<string, CustomerStringKey> = {
  PickedUp: 'statusPickedUp',
  OutForDelivery: 'phaseOnTheWay',
};

export interface HomeOrderStatusCardProps {
  order: ActiveOrder;
  /** Other orders waiting behind this one; shows a "+N more" chip when > 0 */
  moreCount: number;
  onPress: (orderId: string) => void;
  onMorePress: () => void;
  /** Only offered for delivered/cancelled orders */
  onDismiss: (orderId: string) => void;
}

function formatEta(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HomeOrderStatusCard({
  order,
  moreCount,
  onPress,
  onMorePress,
  onDismiss,
}: HomeOrderStatusCardProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  const hue = ORDER_STATUS_COLORS[order.status] ?? c.primary;
  const phase = phaseFor(order.status);
  const phaseIndex = phaseIndexFor(order.status);
  const isFinished = phase === 'delivered' || phase === 'cancelled';
  const restaurantName = order.restaurant?.name ?? t('yourOrder');
  const shortNumber = order.orderNumber.slice(-4);
  const eta = formatEta(order.estimatedDeliveryTime);
  const headlineKey = HEADLINES[order.status];
  const headline = headlineKey ? t(headlineKey) : order.status;
  const badgeKey = BADGE_LABELS[order.status] ?? orderStatusKey(order.status);

  let footer: string | null = null;
  if (phase === 'cancelled') footer = order.cancellationReason || t('tapForDetails');
  else if (phase === 'delivered') footer = order.isReviewed ? t('enjoyYourMeal') : t('rateYourOrder');
  else if (eta) footer = t('arrivingAround', { time: eta });

  const riderLine =
    phase === 'on_the_way' && order.deliveryPerson?.name
      ? t('riderDelivering', { name: order.deliveryPerson.name })
      : null;

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.card}
        onPress={() => onPress(order._id)}
        accessibilityRole="button"
        accessibilityLabel={t('openOrderA11y', { headline, restaurant: restaurantName })}
      >
        <View style={styles.headerRow}>
          {order.restaurant?.logo ? (
            <Image source={{ uri: order.restaurant.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Ionicons name="restaurant-outline" size={18} color={c.primary} />
            </View>
          )}

          <View style={styles.titleCol}>
            <Text style={styles.headline} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={styles.subline} numberOfLines={1}>
              {restaurantName} · #{shortNumber}
            </Text>
          </View>

          {isFinished ? (
            <Pressable
              onPress={() => onDismiss(order._id)}
              hitSlop={10}
              style={styles.dismiss}
              accessibilityRole="button"
              accessibilityLabel={t('dismissOrderUpdate')}
            >
              <Ionicons name="close" size={16} color={c.customerTextMuted} />
            </Pressable>
          ) : (
            <View style={[styles.badge, { backgroundColor: `${hue}1F` }]}>
              <Text style={[styles.badgeText, { color: hue }]}>
                {badgeKey ? t(badgeKey) : order.status}
              </Text>
            </View>
          )}
        </View>

        {phase !== 'cancelled' ? (
          <View style={styles.progress}>
            <View style={styles.segments}>
              {ORDER_PHASES.map((p, idx) => (
                <View
                  key={p.key}
                  style={[
                    styles.segment,
                    idx <= phaseIndex && { backgroundColor: idx === phaseIndex ? hue : `${hue}66` },
                  ]}
                />
              ))}
            </View>
            <View style={styles.segmentLabels}>
              {ORDER_PHASES.map((p, idx) => (
                <Text
                  key={p.key}
                  style={[styles.segmentLabel, idx === phaseIndex && { color: c.customerTextPrimary }]}
                  numberOfLines={1}
                >
                  {t(p.label)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {riderLine ? (
          <View style={styles.riderRow}>
            <Ionicons name="bicycle-outline" size={14} color={c.customerTextSecondary} />
            <Text style={styles.riderText} numberOfLines={1}>
              {riderLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text
            style={[styles.footerText, phase === 'delivered' && !order.isReviewed && styles.footerAction]}
            numberOfLines={1}
          >
            {footer ?? ' '}
          </Text>
          <View style={styles.trackLink}>
            <Text style={styles.trackText}>{t('trackOrder')}</Text>
            <Ionicons name="chevron-forward" size={14} color={c.primary} />
          </View>
        </View>
      </Pressable>

      {moreCount > 0 ? (
        <Pressable
          onPress={onMorePress}
          style={styles.moreChip}
          accessibilityRole="button"
          accessibilityLabel={t(moreCount === 1 ? 'moreOrdersA11yOne' : 'moreOrdersA11yOther', { count: moreCount })}
        >
          <Text style={styles.moreText}>
            {t(moreCount === 1 ? 'moreOrdersOne' : 'moreOrdersOther', { count: moreCount })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    // Sits above the hero on the same white band as the header, so there's no body-colour gap
    wrap: {
      backgroundColor: c.customerSurface,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    card: {
      backgroundColor: c.customerSurface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.customerBorder,
      padding: 14,
      gap: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 10,
    },
    logoFallback: {
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleCol: {
      flex: 1,
      gap: 2,
    },
    headline: {
      fontSize: 15,
      fontFamily: Fonts.brandBold,
      color: c.customerTextPrimary,
    },
    subline: {
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.customerTextSecondary,
    },
    badge: {
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: Fonts.brandBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    dismiss: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.customerBodyBg,
    },
    progress: {
      gap: 6,
    },
    segments: {
      flexDirection: 'row',
      gap: 4,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.customerBorder,
    },
    segmentLabels: {
      flexDirection: 'row',
      gap: 4,
    },
    segmentLabel: {
      flex: 1,
      fontSize: 10,
      fontFamily: Fonts.brandBold,
      color: c.customerTextMuted,
    },
    riderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    riderText: {
      flex: 1,
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.customerTextSecondary,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    footerText: {
      flex: 1,
      fontSize: 13,
      fontFamily: Fonts.brandBold,
      color: c.customerTextPrimary,
    },
    footerAction: {
      color: c.primary,
    },
    trackLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    trackText: {
      fontSize: 13,
      fontFamily: Fonts.brandBold,
      color: c.primary,
    },
    moreChip: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: c.primaryLight,
    },
    moreText: {
      fontSize: 11,
      fontFamily: Fonts.brandBold,
      color: c.primary,
    },
  });
}
