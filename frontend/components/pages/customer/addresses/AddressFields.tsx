import { useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, tintBg, BRAND_RED_TINT, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { PRESET_LABELS, displayLabel, labelIcon, presetFor } from './addressLabels';

export interface AddressDraft {
  label: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  instructions: string;
}

export const EMPTY_ADDRESS_DRAFT: AddressDraft = {
  label: 'Home',
  streetAddress: '',
  city: '',
  zipCode: '',
  instructions: '',
};

export function isDraftComplete(d: AddressDraft): boolean {
  return !!(d.streetAddress.trim() && d.city.trim() && d.zipCode.trim());
}

export interface AddressFieldsProps {
  value: AddressDraft;
  onChange: (draft: AddressDraft) => void;
  /** Checkout has its own delivery-notes box, so it hides this one. */
  showInstructions?: boolean;
}

/** Label chips + street / city / zip (+ instructions) inputs. Controlled. */
export default function AddressFields({ value, onChange, showInstructions = true }: AddressFieldsProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const preset = presetFor(value.label);
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });

  return (
    <View>
      <Text style={styles.fieldLabel}>{t('addressLabel')}</Text>
      <View style={styles.chips}>
        {PRESET_LABELS.map((p) => {
          const active = preset === p;
          return (
            <Pressable
              key={p}
              style={[
                styles.chip,
                active && [styles.chipActive, { backgroundColor: tintBg(c.brand, BRAND_RED_TINT, c.isDark) }],
              ]}
              onPress={() => set({ label: p })}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Ionicons name={labelIcon(p)} size={16} color={active ? c.primary : c.muted} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{displayLabel(p, t)}</Text>
            </Pressable>
          );
        })}
      </View>
      {preset === 'Other' ? (
        <TextInput
          style={styles.input}
          placeholder={t('customLabelPlaceholder')}
          value={value.label === 'Other' ? '' : value.label}
          onChangeText={(text) => set({ label: text.trim() ? text : 'Other' })}
          maxLength={30}
          placeholderTextColor={c.muted}
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder={t('streetAddress')}
        value={value.streetAddress}
        onChangeText={(streetAddress) => set({ streetAddress })}
        textContentType="fullStreetAddress"
        placeholderTextColor={c.muted}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder={t('city')}
          value={value.city}
          onChangeText={(city) => set({ city })}
          textContentType="addressCity"
          placeholderTextColor={c.muted}
        />
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder={t('zipCode')}
          value={value.zipCode}
          onChangeText={(zipCode) => set({ zipCode })}
          textContentType="postalCode"
          keyboardType="number-pad"
          placeholderTextColor={c.muted}
        />
      </View>
      {showInstructions ? (
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t('deliveryInstructions')}
          value={value.instructions}
          onChangeText={(instructions) => set({ instructions })}
          maxLength={200}
          multiline
          placeholderTextColor={c.muted}
        />
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    fieldLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.customerTextSecondary,
      marginBottom: 8,
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.customerSurface,
    },
    chipActive: {
      borderColor: c.primary,
    },
    chipText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.customerTextSecondary,
    },
    chipTextActive: {
      color: c.primary,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.text,
      marginBottom: 10,
      backgroundColor: c.customerSurface,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    flex: {
      flex: 1,
    },
    multiline: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
  });
}
