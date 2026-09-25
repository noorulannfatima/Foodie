import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, tintBg, BRAND_RED_TINT, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { formatAddressLine } from '@/stores/addressStore';
import type { SavedAddress } from '@/services/api/customer.api';
import { displayLabel, labelIcon } from './addressLabels';

export interface AddressOptionProps {
  address: SavedAddress;
  selected: boolean;
  onPress: () => void;
}

/** One saved address as a radio row (checkout, home address picker). */
export default function AddressOption({ address, selected, onPress }: AddressOptionProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <Pressable
      style={[
        styles.row,
        selected && [styles.rowSelected, { backgroundColor: tintBg(c.brand, BRAND_RED_TINT, c.isDark) }],
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Ionicons name={labelIcon(address.label)} size={20} color={selected ? c.primary : c.muted} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
            {displayLabel(address.label, t)}
          </Text>
          {address.isDefault ? <Text style={styles.badge}>{t('defaultBadge')}</Text> : null}
        </View>
        <Text style={styles.line} numberOfLines={2}>
          {formatAddressLine(address)}
        </Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? c.primary : c.muted}
      />
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: c.customerSurface,
    },
    rowSelected: {
      borderColor: c.primary,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.text,
      flexShrink: 1,
    },
    labelSelected: {
      color: c.primary,
    },
    badge: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.customerTextSecondary,
      backgroundColor: c.customerBodyBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    line: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
    },
  });
}
