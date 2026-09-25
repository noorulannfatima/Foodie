import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { useAddressStore, selectDefaultAddress } from '@/stores/addressStore';
import { AddressPickerSheet, displayLabel } from '@/components/pages/customer/addresses';
import { getGreeting } from './getGreeting';

export interface CustomerHomeHeroProps {
  userName: string;
}

export default function CustomerHomeHero({ userName }: CustomerHomeHeroProps) {
  const t = useCustomerT();
  const c = useAppThemeColors(); // hero block background/text follow light or dark customer palette
  const styles = useMemo(() => createHeroStyles(c), [c]);
  const defaultAddress = useAddressStore(selectDefaultAddress);
  const [pickerVisible, setPickerVisible] = useState(false);

  const openAddresses = (add: boolean) =>
    router.push({ pathname: '/(customer)/addresses', params: add ? { add: '1' } : {} });

  return (
    <View style={styles.heroSection}>
      <Pressable
        style={styles.locationRow}
        onPress={() => (defaultAddress ? setPickerVisible(true) : openAddresses(true))}
        accessibilityRole="button"
      >
        <Ionicons name="location-sharp" size={14} color={c.primary} />
        {defaultAddress ? (
          <>
            <Text style={styles.locationLabel}>{t('deliverTo')}</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {displayLabel(defaultAddress.label, t)} – {defaultAddress.streetAddress}
            </Text>
            <Ionicons name="chevron-down" size={14} color={c.customerTextMuted} />
          </>
        ) : (
          <>
            <Text style={styles.addPrompt}>{t('addDeliveryAddress')}</Text>
            <Ionicons name="add" size={14} color={c.primary} />
          </>
        )}
      </Pressable>
      <AddressPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onManage={({ add }) => {
          setPickerVisible(false);
          openAddresses(add);
        }}
      />
      <Text style={styles.greeting}>
        {getGreeting(t)},{'\n'}
        <Text style={styles.greetingName}>{userName}!</Text>
      </Text>
    </View>
  );
}

function createHeroStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    heroSection: {
      backgroundColor: c.customerSurface,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      marginBottom: 16,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 14,
    },
    locationLabel: {
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
    },
    locationValue: {
      fontSize: 12,
      fontFamily: Fonts.brandBold,
      color: c.customerTextPrimary,
      flex: 1,
    },
    addPrompt: {
      fontSize: 12,
      fontFamily: Fonts.brandBold,
      color: c.primary,
    },
    greeting: {
      fontSize: 15,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
      lineHeight: 26,
    },
    greetingName: {
      fontSize: 28,
      fontFamily: Fonts.brandBlack,
      color: c.customerTextPrimary,
      lineHeight: 36,
    },
  });
}
