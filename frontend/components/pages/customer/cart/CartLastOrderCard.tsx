import { useMemo } from 'react';
import { View, Text, Image, Pressable, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import type { CartSuggestions } from '@/services/api/customer.api';
import { formatCartCurrency } from './formatCartCurrency';

export interface CartLastOrderCardProps {
  order: NonNullable<CartSuggestions['lastOrder']>;
  reordering: boolean;
  onReorder: () => void;
  onOpen: () => void;
}

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function CartLastOrderCard({ order, reordering, onReorder, onOpen }: CartLastOrderCardProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const logo = order.restaurant?.logo || order.restaurant?.image?.[0];
  const itemsSummary = order.items
    .map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name))
    .join(', ');

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.topRow}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Ionicons name="restaurant-outline" size={20} color={c.customerTextMuted} />
          </View>
        )}
        <View style={styles.headText}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {order.restaurant?.name ?? t('restaurantFallback')}
          </Text>
          <Text style={styles.meta}>
            {t('deliveredOn', { date: formatOrderDate(order.createdAt) })} · {formatCartCurrency(order.total)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.customerTextMuted} />
      </View>

      <Text style={styles.items} numberOfLines={2}>
        {itemsSummary}
      </Text>

      <TouchableOpacity style={styles.reorderBtn} onPress={onReorder} disabled={reordering}>
        {reordering ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.reorderText}>{t('orderAgain')}</Text>
          </>
        )}
      </TouchableOpacity>
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.customerSurface,
      borderWidth: 1,
      borderColor: c.customerBorder,
      gap: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: c.customerBodyBg,
    },
    logoFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    headText: {
      flex: 1,
      gap: 2,
    },
    restaurantName: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.customerTextPrimary,
    },
    meta: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    items: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      lineHeight: 18,
      color: c.customerTextSecondary,
    },
    reorderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.brand,
    },
    reorderText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
  });
}
