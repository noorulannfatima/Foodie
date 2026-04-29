import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

// Two payment options the backend supports end-to-end:
//   - Safepay  (online card / wallet via hosted checkout)
//   - Cash     (Cash on Delivery, paid to the rider)
const PAYMENTS = [
  {
    key: 'Safepay',
    icon: 'card-outline' as const,
    label: 'Pay with Safepay',
    sub: 'Card / Wallet — secure online checkout',
  },
  {
    key: 'Cash',
    icon: 'cash-outline' as const,
    label: 'Cash on Delivery',
    sub: 'Pay the rider in cash on arrival',
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
  const styles = useMemo(() => createStyles(c), [c]);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('Safepay');
  const [placing, setPlacing] = useState(false);

  const handlePlace = async () => {
    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      Alert.alert('Validation', 'Please fill in delivery address');
      return;
    }
    setPlacing(true);
    try {
      await onPlaceOrder({
        deliveryAddress: { street, city, zipCode, instructions },
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
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>FOODIE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Finalize your gourmet selection</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color={c.primary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            value={street}
            onChangeText={setStreet}
            placeholderTextColor={c.muted}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="City"
              value={city}
              onChangeText={setCity}
              placeholderTextColor={c.muted}
            />
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              placeholderTextColor={c.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={18} color={c.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          {PAYMENTS.map((p) => {
            const active = paymentMethod === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.paymentOption, active && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(p.key as CheckoutPaymentMethod)}
              >
                <Ionicons name={p.icon} size={20} color={active ? c.text : c.muted} />
                <View style={styles.paymentTextWrap}>
                  <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>
                    {p.label}
                  </Text>
                  <Text style={styles.paymentSub}>{p.sub}</Text>
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
            <Text style={styles.sectionTitle}>Delivery Notes</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add instructions for the rider (e.g., Gate code, floor number...)"
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
          <Text style={styles.placeBtnText}>{placing ? 'Placing Order...' : 'Place Order'}</Text>
        </TouchableOpacity>

        <Text style={styles.secureText}>SECURE PAYMENT POWERED BY FOODIEPAY</Text>
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
      backgroundColor: c.navBar,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      paddingTop: 50,
    },
    headerSpacer: {
      width: 24,
    },
    headerLogo: {
      fontSize: 18,
      fontFamily: Fonts.brandBlack,
      color: '#FFFFFF',
      letterSpacing: 3,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
      marginBottom: 24,
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
    inputFlex: {
      flex: 1,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 10,
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
      borderColor: c.text,
      borderWidth: 2,
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
    secureText: {
      fontFamily: Fonts.brand,
      fontSize: 10,
      color: c.muted,
      textAlign: 'center',
      marginTop: 12,
      letterSpacing: 1,
    },
  });
}
