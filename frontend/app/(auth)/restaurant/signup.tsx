import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';

const CUISINE_OPTIONS = [
  'Pakistani', 'Chinese', 'Fast Food', 'BBQ', 'Italian',
  'Indian', 'Continental', 'Desi', 'Burgers', 'Pizza',
  'Seafood', 'Desserts', 'Bakery', 'Healthy',
];

const DELIVERY_OPTIONS = ['Delivery', 'Pickup', 'Dine-in'] as const;
const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;

type DeliveryOption = typeof DELIVERY_OPTIONS[number];
type PaymentOption = typeof PAYMENT_OPTIONS[number];

function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
  activeColor,
}: {
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  activeColor: string;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            style={[chipStyles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipText: { color: 'white', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
});

export default function RestaurantSignup() {
  // Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Restaurant details
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(['Delivery']);
  const [paymentMethods, setPaymentMethods] = useState<PaymentOption[]>(['Cash']);

  // Delivery settings
  const [minimumOrder, setMinimumOrder] = useState('100');
  const [deliveryFee, setDeliveryFee] = useState('50');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('30');

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signup, isLoading } = useAuthStore();

  function toggleItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }
    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      Alert.alert('Error', 'Please fill in the full address');
      return;
    }
    if (cuisineTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one cuisine type');
      return;
    }
    if (deliveryOptions.length === 0) {
      Alert.alert('Error', 'Please select at least one delivery option');
      return;
    }
    if (paymentMethods.length === 0) {
      Alert.alert('Error', 'Please select at least one payment method');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      await signup(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          description: description.trim(),
          address: {
            street: street.trim(),
            city: city.trim(),
            zipCode: zipCode.trim(),
            country: 'Pakistan',
          },
          cuisineTypes,
          deliveryOptions,
          paymentMethods,
          minimumOrder: Number(minimumOrder) || 100,
          deliveryFee: Number(deliveryFee) || 50,
          deliveryRadius: Number(deliveryRadius) || 5,
          estimatedDeliveryTime: Number(estimatedDeliveryTime) || 30,
        } as any,
        'restaurant',
      );
      router.replace('/(restaurant)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <LinearGradient colors={['#a71215', '#e27373']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.badge}>Restaurant</Text>
            <Text style={styles.title}>Register Restaurant</Text>
            <Text style={styles.subtitle}>Start serving customers on Foodie</Text>
          </View>

          <View style={styles.form}>

            {/* ── Basic Info ─────────────────────── */}
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Field label="Restaurant Name *">
              <TextInput style={styles.input} placeholder="Enter restaurant name" placeholderTextColor="#999"
                value={name} onChangeText={setName} />
            </Field>

            <Field label="Email *">
              <TextInput style={styles.input} placeholder="Enter email" placeholderTextColor="#999"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </Field>

            <Field label="Phone *">
              <TextInput style={styles.input} placeholder="+92 3XX XXXXXXX" placeholderTextColor="#999"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </Field>

            <Field label="Description * (min 10 chars)">
              <TextInput style={[styles.input, styles.textArea]}
                placeholder="Tell customers what makes your restaurant special"
                placeholderTextColor="#999" value={description} onChangeText={setDescription}
                multiline numberOfLines={3} />
            </Field>

            {/* ── Address ────────────────────────── */}
            <Text style={styles.sectionTitle}>Address</Text>

            <Field label="Street Address *">
              <TextInput style={styles.input} placeholder="Street / Area" placeholderTextColor="#999"
                value={street} onChangeText={setStreet} />
            </Field>

            <View style={styles.row}>
              <View style={[styles.flex]}>
                <Field label="City *">
                  <TextInput style={styles.input} placeholder="City" placeholderTextColor="#999"
                    value={city} onChangeText={setCity} />
                </Field>
              </View>
              <View style={{ width: 120 }}>
                <Field label="Zip Code *">
                  <TextInput style={styles.input} placeholder="00000" placeholderTextColor="#999"
                    value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" />
                </Field>
              </View>
            </View>

            {/* ── Cuisine Types ──────────────────── */}
            <Text style={styles.sectionTitle}>Cuisine Types *</Text>
            <Text style={styles.hint}>Select at least one</Text>
            <ChipGroup
              options={CUISINE_OPTIONS}
              selected={cuisineTypes}
              onToggle={(v) => setCuisineTypes((p) => toggleItem(p, v))}
              activeColor="#2C8C85"
            />

            {/* ── Delivery & Payment ─────────────── */}
            <Text style={styles.sectionTitle}>Service Options *</Text>

            <Field label="Delivery Options *">
              <ChipGroup
                options={DELIVERY_OPTIONS}
                selected={deliveryOptions}
                onToggle={(v) => setDeliveryOptions((p) => toggleItem(p, v))}
                activeColor="#2C8C85"
              />
            </Field>

            <Field label="Payment Methods *">
              <ChipGroup
                options={PAYMENT_OPTIONS}
                selected={paymentMethods}
                onToggle={(v) => setPaymentMethods((p) => toggleItem(p, v))}
                activeColor="#2C8C85"
              />
            </Field>

            {/* ── Delivery Settings ──────────────── */}
            <Text style={styles.sectionTitle}>Delivery Settings</Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="Min. Order (PKR)">
                  <TextInput style={styles.input} placeholder="100" placeholderTextColor="#999"
                    value={minimumOrder} onChangeText={setMinimumOrder} keyboardType="number-pad" />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Delivery Fee (PKR)">
                  <TextInput style={styles.input} placeholder="50" placeholderTextColor="#999"
                    value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="number-pad" />
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="Delivery Radius (km)">
                  <TextInput style={styles.input} placeholder="5" placeholderTextColor="#999"
                    value={deliveryRadius} onChangeText={setDeliveryRadius} keyboardType="number-pad" />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Est. Time (mins)">
                  <TextInput style={styles.input} placeholder="30" placeholderTextColor="#999"
                    value={estimatedDeliveryTime} onChangeText={setEstimatedDeliveryTime} keyboardType="number-pad" />
                </Field>
              </View>
            </View>

            {/* ── Password ───────────────────────── */}
            <Text style={styles.sectionTitle}>Account Security</Text>

            <Field label="Password *">
              <TextInput style={styles.input} placeholder="Min 8 characters" placeholderTextColor="#999"
                value={password} onChangeText={setPassword} secureTextEntry />
            </Field>

            <Field label="Confirm Password *">
              <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor="#999"
                value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </Field>

            <Pressable style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSignup} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#4ECDC4" /> : <Text style={styles.buttonText}>Register Restaurant</Text>}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already registered? </Text>
              <Pressable onPress={() => router.replace('/(auth)/restaurant/login')}>
                <Text style={styles.linkText}>Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backText: { color: 'white', fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 28 },
  badge: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '800', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 4, marginTop: -2 },
  form: { gap: 14 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
  row: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: 'white', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#4ECDC4', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  linkText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
