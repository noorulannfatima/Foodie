import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { OrderItem } from '@/stores/restaurantStore';
import { ORDER_STATUS_COLORS } from '@/components/pages/restaurant/shared/orderStatus';
import { formatRestaurantCurrency } from '@/components/pages/restaurant/shared/orderUtils';
import { NEXT_STATUS } from './constants';

export interface OrderDetailModalProps {
  order: OrderItem | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}

export default function OrderDetailModal({ order, onClose, onStatusUpdate }: OrderDetailModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  if (!order) return null;

  const nextAction = NEXT_STATUS[order.status];
  const statusColor = ORDER_STATUS_COLORS[order.status] || c.muted;

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Order #{order.orderNumber}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.modalContent}>
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>STATUS</Text>
          <View style={[styles.statusBadgeLg, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusBadgeLgText, { color: statusColor }]}>{order.status}</Text>
          </View>
        </View>

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
                {item.specialInstructions ? (
                  <Text style={styles.modalItemNote}>{item.specialInstructions}</Text>
                ) : null}
                <Text style={styles.modalItemQty}>QTY: {item.quantity}</Text>
              </View>
              <Text style={styles.modalItemPrice}>{formatRestaurantCurrency(item.price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.modalSection}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>{formatRestaurantCurrency(order.pricing.subtotal)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Delivery Fee</Text>
            <Text style={styles.pricingValue}>{formatRestaurantCurrency(order.pricing.deliveryFee)}</Text>
          </View>
          {order.pricing.tax > 0 ? (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Tax</Text>
              <Text style={styles.pricingValue}>{formatRestaurantCurrency(order.pricing.tax)}</Text>
            </View>
          ) : null}
          <View style={styles.pricingDivider} />
          <View style={styles.pricingRow}>
            <Text style={styles.pricingTotal}>TOTAL</Text>
            <Text style={styles.pricingTotalValue}>{formatRestaurantCurrency(order.pricing.total)}</Text>
          </View>
        </View>

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

        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>DELIVERY ADDRESS</Text>
          <Text style={styles.addressText}>
            {order.deliveryAddress.street}, {order.deliveryAddress.city} {order.deliveryAddress.zipCode}
          </Text>
          {order.deliveryAddress.instructions ? (
            <View style={styles.driverNote}>
              <Text style={styles.driverNoteLabel}>DRIVER NOTE</Text>
              <Text style={styles.driverNoteText}>{order.deliveryAddress.instructions}</Text>
            </View>
          ) : null}
        </View>

        {nextAction ? (
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
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: c.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
    },
    modalTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
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
      color: c.muted,
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
      backgroundColor: c.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    itemCountText: {
      fontFamily: Fonts.brandBold,
      fontSize: 10,
      color: c.secondary,
      letterSpacing: 0.5,
    },
    modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalItemInfo: {
      flex: 1,
      marginRight: 12,
    },
    modalItemName: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
      marginBottom: 2,
    },
    modalItemNote: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      fontStyle: 'italic',
      marginBottom: 2,
    },
    modalItemQty: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.muted,
      letterSpacing: 0.5,
      marginTop: 4,
    },
    modalItemPrice: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    pricingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    pricingLabel: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    pricingValue: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.text,
    },
    pricingDivider: {
      borderBottomWidth: 1,
      borderStyle: 'dashed',
      borderBottomColor: c.border,
      marginVertical: 8,
    },
    pricingTotal: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.primary,
    },
    pricingTotalValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.primary,
    },
    customerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.secondary,
      borderRadius: 12,
      padding: 16,
    },
    customerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
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
      color: c.text,
      lineHeight: 20,
    },
    driverNote: {
      backgroundColor: c.isDark ? '#3D2E18' : '#FFF7ED',
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
      color: c.text,
    },
    modalAction: {
      marginTop: 8,
    },
    modalActionBtn: {
      backgroundColor: c.primary,
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
}
