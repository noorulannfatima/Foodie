import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_RED_TINT, Fonts, tintBg, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import type { CustomerStringKey } from '@/constants/customerStrings';
import { useAddressStore, selectDefaultAddress } from '@/stores/addressStore';
import {
  AddressFields,
  AddressOption,
  EMPTY_ADDRESS_DRAFT,
  isDraftComplete,
  type AddressDraft,
} from '@/components/pages/customer/addresses';

// Two payment options the backend supports end-to-end:
//   - Safepay  (online card / wallet via hosted checkout)
//   - Cash     (Cash on Delivery, paid to the rider)
const PAYMENTS: {
  key: string;
  icon: 'card-outline' | 'cash-outline';
  label: CustomerStringKey;
  sub: CustomerStringKey;
}[] = [
  {
    key: 'Safepay',
    icon: 'card-outline',
    label: 'payWithSafepay',
    sub: 'payWithSafepayHint',
  },
  {
    key: 'Cash',
    icon: 'cash-outline',
    label: 'cashOnDelivery',
    sub: 'cashOnDeliveryHint',
  },
];

export type CheckoutPaymentMethod = 'Safepay' | 'Cash';

export interface CheckoutModalProps {
  onClose: () => void;
  onPlaceOrder: (data: {
    deliveryAddress: { street: string; city: string; zipCode: string; instructions: string };
    paymentMethod: CheckoutPaymentMethod;
  }) => Promise<void>;
}

export default function CheckoutModal({ onClose, onPlaceOrder }: CheckoutModalProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const addresses = useAddressStore((s) => s.addresses);
  const defaultAddress = useAddressStore(selectDefaultAddress);
  // Saved addresses: the default is picked for you. Otherwise type one in.
  const [selectedId, setSelectedId] = useState<string | null>(defaultAddress?._id ?? null);
  const [addingNew, setAddingNew] = useState(!defaultAddress);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_ADDRESS_DRAFT);
  const [saveNew, setSaveNew] = useState(true);
  const [instructions, setInstructions] = useState(defaultAddress?.instructions ?? '');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('Safepay');
  const [placing, setPlacing] = useState(false);

  // Addresses can finish loading after the sheet opens: pick the default then,
  // unless the customer has started typing a new one.
  useEffect(() => {
    if (selectedId || !defaultAddress) return;
    setSelectedId(defaultAddress._id);
    if (!draft.streetAddress && !draft.city && !draft.zipCode) {
      setAddingNew(false);
      setInstructions((prev) => prev || defaultAddress.instructions || '');
    }
  }, [defaultAddress]);

  const selected = addresses.find((a) => a._id === selectedId) ?? null;

  const selectSaved = (id: string) => {
    const address = addresses.find((a) => a._id === id);
    setSelectedId(id);
    setAddingNew(false);
    setInstructions(address?.instructions ?? '');
  };

  const handlePlace = async () => {
    const address = addingNew ? null : selected;
    if (!address && !isDraftComplete(draft)) {
      Alert.alert(t('validation'), t('fillDeliveryAddress'));
      return;
    }
    setPlacing(true);
    try {
      if (!address && saveNew) {
        // Best effort: a failed save must not stop the order.
        await useAddressStore.getState().add(draft).catch(() => {});
      }
      const source = address ?? draft;
      await onPlaceOrder({
        deliveryAddress: {
          street: source.streetAddress.trim(),
          city: source.city.trim(),
          zipCode: source.zipCode.trim(),
          instructions,
        },
        paymentMethod,
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('closeCheckout')}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkout')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color={c.primary} />
            <Text style={styles.sectionTitle}>{t('deliveryAddress')}</Text>
          </View>
          {addresses.map((a) => (
            <AddressOption
              key={a._id}
              address={a}
              selected={!addingNew && a._id === selectedId}
              onPress={() => selectSaved(a._id)}
            />
          ))}

          {addingNew ? (
            <View style={addresses.length > 0 ? styles.newAddressBox : undefined}>
              <AddressFields value={draft} onChange={setDraft} showInstructions={false} />
              <Pressable
                style={styles.checkRow}
                onPress={() => setSaveNew((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: saveNew }}
              >
                <Ionicons
                  name={saveNew ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={saveNew ? c.primary : c.muted}
                />
                <Text style={styles.checkText}>{t('saveToMyAddresses')}</Text>
              </Pressable>
            </View>
          ) : null}

          {addresses.length > 0 ? (
            <Pressable
              style={styles.addressToggle}
              onPress={() =>
                addingNew ? selectSaved(selectedId ?? addresses[0]._id) : setAddingNew(true)
              }
            >
              <Ionicons name={addingNew ? 'list-outline' : 'add-circle-outline'} size={18} color={c.primary} />
              <Text style={styles.addressToggleText}>
                {addingNew ? t('useSavedAddress') : t('addNewAddress')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={18} color={c.primary} />
            <Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>
          </View>
          {PAYMENTS.map((p) => {
            const active = paymentMethod === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.paymentOption,
                  active && [
                    styles.paymentOptionActive,
                    { backgroundColor: tintBg(c.brand, BRAND_RED_TINT, c.isDark) },
                  ],
                ]}
                onPress={() => setPaymentMethod(p.key as CheckoutPaymentMethod)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Ionicons name={p.icon} size={20} color={active ? c.primary : c.muted} />
                <View style={styles.paymentTextWrap}>
                  <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>
                    {t(p.label)}
                  </Text>
                  <Text style={styles.paymentSub}>{t(p.sub)}</Text>
                </View>
                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={c.primary}
                    style={styles.checkIcon}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbox-outline" size={18} color={c.primary} />
            <Text style={styles.sectionTitle}>{t('deliveryNotes')}</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder={t('deliveryNotesPlaceholder')}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholderTextColor={c.muted}
          />
        </View>

        <TouchableOpacity
          style={[styles.placeBtn, placing && { opacity: 0.6 }]}
          onPress={handlePlace}
          disabled={placing}
        >
          <Text style={styles.placeBtnText}>{placing ? t('placingOrder') : t('placeOrder')}</Text>
        </TouchableOpacity>

        {paymentMethod === 'Safepay' ? (
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed-outline" size={12} color={c.muted} />
            <Text style={styles.secureText}>{t('safepaySecureNote')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    header: {
      backgroundColor: c.customerSurface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: Fonts.brandBlack,
      color: c.text,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
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
    newAddressBox: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      backgroundColor: c.customerBodyBg,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    checkText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.text,
    },
    addressToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    addressToggleText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.primary,
    },
    notesInput: {
      minHeight: 60,
      textAlignVertical: 'top',
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
      backgroundColor: c.customerSurface,
    },
    paymentOptionActive: {
      borderColor: c.brand,
      borderWidth: 1.5,
    },
    paymentTextWrap: {
      flex: 1,
    },
    paymentLabel: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    paymentLabelActive: {
      fontFamily: Fonts.brandBold,
      color: c.text,
    },
    paymentSub: {
      fontFamily: Fonts.brand,
      fontSize: 11,
      color: c.muted,
      marginTop: 2,
    },
    checkIcon: {
      marginLeft: 'auto',
    },
    placeBtn: {
      backgroundColor: c.secondary,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 8,
    },
    placeBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
    },
    secureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
    },
    secureText: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
  });
}
