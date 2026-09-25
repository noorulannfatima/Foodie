import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppThemeColors, Fonts } from '@/constants/theme';
import type { RestaurantProfile } from '@/stores/restaurantStore';
import { Switch } from '@/components/atoms';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';
import { useRestaurantT, type RestaurantStringKey } from '@/constants/restaurantStrings';
import { formatProfileCurrency } from './formatProfileCurrency';

const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;

const PAYMENT_LABEL_KEYS: Record<(typeof PAYMENT_OPTIONS)[number], RestaurantStringKey> = {
  Cash: 'profilePaymentCash',
  Card: 'profilePaymentCard',
  Wallet: 'profilePaymentWallet',
  Online: 'profilePaymentOnline',
};

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
  onEditDeliverySettings: () => void;
}

export default function AccountTab({
  profile,
  refreshing,
  onRefresh,
  onUpdatePaymentMethods,
  onEditDeliverySettings,
}: AccountTabProps) {
  const { screenStyles } = useRestaurantProfileStyles();
  const c = useAppThemeColors();
  const t = useRestaurantT();

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
          flex: 1,
          fontFamily: Fonts.brandBold,
          fontSize: 12,
          color: c.muted,
          letterSpacing: 1,
        },
        editBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: c.border,
        },
        editBtnText: {
          fontFamily: Fonts.brandBold,
          fontSize: 12,
          color: c.text,
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
          <Text style={styles.cardTitle}>{t('profileDeliverySettingsCaps')}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditDeliverySettings}
            accessibilityRole="button"
            accessibilityLabel={t('profileEditDeliverySettings')}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={14} color={c.text} />
            <Text style={styles.editBtnText}>{t('profileEdit')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profileDeliveryRadius')}</Text>
          <Text style={styles.settingValue}>{profile.deliveryRadius} {t('profileUnitKm')}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profileMinimumOrder')}</Text>
          <Text style={styles.settingValue}>{formatProfileCurrency(profile.minimumOrder)}</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profileDeliveryFee')}</Text>
          <Text style={styles.settingValue}>
            {profile.deliveryFee === 0 ? t('profileFree') : formatProfileCurrency(profile.deliveryFee)}
          </Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profileEstimatedTime')}</Text>
          <Text style={styles.settingValue}>{profile.estimatedDeliveryTime} {t('profileUnitMin')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={18} color={c.primary} />
          <Text style={styles.cardTitle}>{t('profilePaymentMethodsCaps')}</Text>
        </View>
        <View style={styles.paymentMethods}>
          {PAYMENT_OPTIONS.map((method) => (
            <View key={method} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Ionicons name={paymentIcon(method)} size={18} color={c.text} />
                <Text style={styles.paymentLabel}>{t(PAYMENT_LABEL_KEYS[method])}</Text>
              </View>
              <Switch
                value={profile.paymentMethods.includes(method)}
                onValueChange={(val) => {
                  const methods = val
                    ? [...profile.paymentMethods, method]
                    : profile.paymentMethods.filter((m) => m !== method);
                  if (methods.length === 0) {
                    Alert.alert(t('error'), t('profilePaymentRequired'));
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
