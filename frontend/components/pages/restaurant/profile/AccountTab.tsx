import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppThemeColors, Fonts } from '@/constants/theme';
import type { RestaurantProfile } from '@/stores/restaurantStore';
import { Switch } from '@/components/atoms';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';
import { formatProfileCurrency } from './formatProfileCurrency';

const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;

function paymentIcon(method: (typeof PAYMENT_OPTIONS)[number]): ComponentProps<typeof Ionicons>['name'] {
  if (method === 'Cash') return 'cash-outline';
  if (method === 'Card') return 'card-outline';
  if (method === 'Wallet') return 'wallet-outline';
  return 'globe-outline';
}

export interface AccountTabProps {
  profile: RestaurantProfile;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdatePaymentMethods: (methods: string[]) => void;
}

export default function AccountTab({
  profile,
  refreshing,
  onRefresh,
  onUpdatePaymentMethods,
}: AccountTabProps) {
  const { screenStyles } = useRestaurantProfileStyles();
  const c = useAppThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: c.card,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c.border,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        },
        cardTitle: {
          fontFamily: Fonts.brandBold,
          fontSize: 12,
          color: c.muted,
          letterSpacing: 1,
        },
        settingRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        },
        settingLabel: {
          fontFamily: Fonts.brand,
          fontSize: 14,
          color: c.muted,
        },
        settingValue: {
          fontFamily: Fonts.brandBold,
          fontSize: 14,
          color: c.text,
        },
        paymentMethods: {
          gap: 4,
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
        },
        paymentInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        paymentLabel: {
          fontFamily: Fonts.brand,
          fontSize: 14,
          color: c.text,
        },
      }),
    [c],
  );

  return (
    <ScrollView
      style={screenStyles.tabContent}
      contentContainerStyle={screenStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bicycle-outline" size={18} color={c.primary} />
          <Text style={styles.cardTitle}>DELIVERY SETTINGS</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Delivery Radius</Text>
          <Text style={styles.settingValue}>{profile.deliveryRadius} km</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Minimum Order</Text>
          <Text style={styles.settingValue}>{formatProfileCurrency(profile.minimumOrder)}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Delivery Fee</Text>
          <Text style={styles.settingValue}>{formatProfileCurrency(profile.deliveryFee)}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Estimated Time</Text>
          <Text style={styles.settingValue}>{profile.estimatedDeliveryTime} min</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={18} color={c.primary} />
          <Text style={styles.cardTitle}>PAYMENT METHODS</Text>
        </View>
        <View style={styles.paymentMethods}>
          {PAYMENT_OPTIONS.map((method) => (
            <View key={method} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Ionicons name={paymentIcon(method)} size={18} color={c.text} />
                <Text style={styles.paymentLabel}>{method}</Text>
              </View>
              <Switch
                value={profile.paymentMethods.includes(method)}
                onValueChange={(val) => {
                  const methods = val
                    ? [...profile.paymentMethods, method]
                    : profile.paymentMethods.filter((m) => m !== method);
                  if (methods.length === 0) {
                    Alert.alert('Error', 'At least one payment method is required');
                    return;
                  }
                  onUpdatePaymentMethods(methods);
                }}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
