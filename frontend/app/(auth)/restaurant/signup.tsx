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
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  red: '#D62828',
  orange: '#F77F00',
  gold: '#FCBF49',
  navy: '#003049',
  navy2: '#022535',
  pageBg: '#F5F7F9',
  cardBg: '#FFFFFF',
  inputBg: '#EBF4F8',
  border: '#D8E6EE',
  text: '#1A2A33',
  muted: '#6B8A99',
  lightRed: '#FCEAEA',
  lightGold: '#FEF9EE',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CUISINE_OPTIONS = [
  'Pakistani', 'Chinese', 'Fast Food', 'BBQ', 'Italian',
  'Indian', 'Continental', 'Desi', 'Burgers', 'Pizza',
  'Seafood', 'Desserts', 'Bakery', 'Healthy',
];
const DELIVERY_OPTIONS = ['Delivery', 'Pickup', 'Dine-in'] as const;
const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;
type DeliveryOption = typeof DELIVERY_OPTIONS[number];
type PaymentOption = typeof PAYMENT_OPTIONS[number];

// ─── Small components ─────────────────────────────────────────────────────────
function SectionHead({ label, color = C.red }: { label: string; color?: string }) {
  return (
    <View style={s.secHead}>
      <View style={[s.secLine, { backgroundColor: color }]} />
      <Text style={s.secLabel}>{label}</Text>
    </View>
  );
}

function Card({ children, dark = false, style }: { children: React.ReactNode; dark?: boolean; style?: object }) {
  return (
    <View style={[s.card, dark && s.darkCard, style]}>
      {children}
    </View>
  );
}

function Field({
  label, children, dark = false,
}: { label: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, dark && s.fieldLabelDark]}>{label}</Text>
      {children}
    </View>
  );
}

function CheckRow({
  label, checked, onToggle,
}: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={[s.checkItem, checked && s.checkItemActive]}
      onPress={onToggle}
    >
      <Text style={[s.checkLabel, checked && { color: C.text }]}>{label}</Text>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Text style={s.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

function ChipGrid<T extends string>({
  options, selected, onToggle, activeColor = C.red, activeBg = C.lightRed,
}: {
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  activeColor?: string;
  activeBg?: string;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            style={[s.chip, active && { backgroundColor: activeBg, borderColor: activeColor }]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[s.chipText, active && { color: activeColor }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RestaurantSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDesc] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [cuisineTypes, setCuisines] = useState<string[]>([]);
  const [deliveryOptions, setDelivery] = useState<DeliveryOption[]>(['Delivery']);
  const [paymentMethods, setPayment] = useState<PaymentOption[]>(['Cash']);
  const [minimumOrder, setMinOrder] = useState('100');
  const [deliveryFee, setFee] = useState('50');
  const [deliveryRadius, setRadius] = useState('5');
  const [estTime, setEstTime] = useState('30');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const { signup, isLoading } = useAuthStore();

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  }

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields'); return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters'); return;
    }
    if (!street.trim() || !city.trim() || !zipCode.trim()) {
      Alert.alert('Error', 'Please fill in the full address'); return;
    }
    if (cuisineTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one cuisine type'); return;
    }
    if (deliveryOptions.length === 0) {
      Alert.alert('Error', 'Please select at least one delivery option'); return;
    }
    if (paymentMethods.length === 0) {
      Alert.alert('Error', 'Please select at least one payment method'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters'); return;
    }
    try {
      await signup(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          description: description.trim(),
          address: { street: street.trim(), city: city.trim(), zipCode: zipCode.trim(), country: 'Pakistan' },
          cuisineTypes,
          deliveryOptions,
          paymentMethods,
          minimumOrder: Number(minimumOrder) || 100,
          deliveryFee: Number(deliveryFee) || 50,
          deliveryRadius: Number(deliveryRadius) || 5,
          estimatedDeliveryTime: Number(estTime) || 30,
        } as any,
        'restaurant',
      );
      router.replace('/(restaurant)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Nav bar ── */}
      <View style={s.navbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.navBack}>← Back</Text>
        </Pressable>
        <Text style={s.navTitle}>Restaurant Registration</Text>
        <Text style={s.navBrand}>FOODIE</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={[C.navy2, '#005074', C.red]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <View style={s.heroDeco} />
            <Text style={s.heroTitle}>Start Your{'\n'}Culinary Journey.</Text>
            <Text style={s.heroSub}>Register your restaurant on Foodie</Text>
          </LinearGradient>

          <View style={s.body}>

            {/* ── Basic Info ── */}
            <SectionHead label="Basic Information" color={C.red} />
            <Card>
              <Field label="RESTAURANT NAME">
                <TextInput style={s.input} placeholder="e.g. The Golden Saffron"
                  placeholderTextColor={C.muted} value={name} onChangeText={setName} />
              </Field>
              <Field label="EMAIL ADDRESS">
                <TextInput style={s.input} placeholder="contact@restaurant.com"
                  placeholderTextColor={C.muted} value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" />
              </Field>
              <Field label="PHONE NUMBER">
                <TextInput style={s.input} placeholder="+92 3XX XXXXXXX"
                  placeholderTextColor={C.muted} value={phone} onChangeText={setPhone}
                  keyboardType="phone-pad" />
              </Field>
              <Field label="RESTAURANT DESCRIPTION">
                <TextInput
                  style={[s.input, s.textarea]}
                  placeholder="Tell us about your culinary philosophy…"
                  placeholderTextColor={C.muted} value={description} onChangeText={setDesc}
                  multiline numberOfLines={3} />
              </Field>
            </Card>

            {/* ── Location ── */}
            <SectionHead label="Location Details" color={C.gold} />
            <Card>
              <Field label="STREET / AREA">
                <TextInput style={s.input} placeholder="123 Culinary Avenue"
                  placeholderTextColor={C.muted} value={street} onChangeText={setStreet} />
              </Field>
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="CITY">
                    <TextInput style={s.input} placeholder="City"
                      placeholderTextColor={C.muted} value={city} onChangeText={setCity} />
                  </Field>
                </View>
                <View style={{ width: 110 }}>
                  <Field label="ZIP CODE">
                    <TextInput style={s.input} placeholder="00000"
                      placeholderTextColor={C.muted} value={zipCode} onChangeText={setZipCode}
                      keyboardType="number-pad" />
                  </Field>
                </View>
              </View>
            </Card>

            {/* ── Cuisine Types ── */}
            <SectionHead label="Cuisine Types" color={C.orange} />
            <Card>
              <ChipGrid
                options={CUISINE_OPTIONS}
                selected={cuisineTypes}
                onToggle={v => setCuisines(p => toggle(p, v))}
                activeColor={C.red}
                activeBg={C.lightRed}
              />
            </Card>

            {/* ── Service Options ── */}
            <SectionHead label="Service Options" color={C.red} />
            <Card>
              <Text style={s.cardSubLabel}>DELIVERY OPTIONS</Text>
              {DELIVERY_OPTIONS.map(opt => (
                <CheckRow
                  key={opt}
                  label={opt}
                  checked={deliveryOptions.includes(opt)}
                  onToggle={() => setDelivery(p => toggle(p, opt))}
                />
              ))}
              <View style={s.divider} />
              <Text style={[s.cardSubLabel, { marginTop: 4 }]}>PAYMENT METHODS</Text>
              {PAYMENT_OPTIONS.map(opt => (
                <CheckRow
                  key={opt}
                  label={opt}
                  checked={paymentMethods.includes(opt)}
                  onToggle={() => setPayment(p => toggle(p, opt))}
                />
              ))}
            </Card>

            {/* ── Delivery Logistics (dark card) ── */}
            <SectionHead label="Delivery Logistics" color={C.gold} />
            <Card dark>
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="MIN. ORDER" dark>
                    <View style={[s.input, s.darkInput, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <Text style={s.currSymbol}>PKR</Text>
                      <TextInput
                        style={{ flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}
                        placeholder="100" placeholderTextColor="rgba(255,255,255,0.35)"
                        value={minimumOrder} onChangeText={setMinOrder} keyboardType="number-pad" />
                    </View>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="DELIVERY FEE" dark>
                    <View style={[s.input, s.darkInput, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <Text style={s.currSymbol}>PKR</Text>
                      <TextInput
                        style={{ flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}
                        placeholder="50" placeholderTextColor="rgba(255,255,255,0.35)"
                        value={deliveryFee} onChangeText={setFee} keyboardType="number-pad" />
                    </View>
                  </Field>
                </View>
              </View>
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="RADIUS (KM)" dark>
                    <TextInput
                      style={[s.input, s.darkInput]}
                      placeholder="5" placeholderTextColor="rgba(255,255,255,0.35)"
                      value={deliveryRadius} onChangeText={setRadius} keyboardType="number-pad" />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="EST. TIME (MIN)" dark>
                    <TextInput
                      style={[s.input, s.darkInput]}
                      placeholder="30–45" placeholderTextColor="rgba(255,255,255,0.35)"
                      value={estTime} onChangeText={setEstTime} keyboardType="number-pad" />
                  </Field>
                </View>
              </View>
            </Card>

            {/* ── Account Security ── */}
            <SectionHead label="Account Security" color={C.red} />
            <Card>
              <Field label="PASSWORD">
                <TextInput style={s.input} placeholder="Min 8 characters"
                  placeholderTextColor={C.muted} value={password} onChangeText={setPassword}
                  secureTextEntry />
              </Field>
              <Field label="CONFIRM PASSWORD">
                <TextInput style={s.input} placeholder="Re-enter password"
                  placeholderTextColor={C.muted} value={confirmPassword} onChangeText={setConfirm}
                  secureTextEntry />
              </Field>
            </Card>

            {/* ── CTA ── */}
            <Pressable
              style={[s.ctaBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaBtnText}>Register Restaurant →</Text>}
            </Pressable>
            <Text style={s.ctaSub}>
              By clicking register, you agree to our{' '}
              <Text style={{ color: C.red, fontWeight: '600' }}>Terms of Service</Text>
            </Text>

            <View style={s.footer}>
              <Text style={s.footerText}>Already registered? </Text>
              <Pressable onPress={() => router.replace('/(auth)/restaurant/login')}>
                <Text style={s.footerLink}>Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        <Pressable style={s.bbItem}>
          <Text style={s.bbIcon}>🕐</Text>
          <Text style={s.bbLabel}>Save Progress</Text>
        </Pressable>
        <Pressable style={s.bbItem}>
          <Text style={[s.bbIcon, { fontSize: 16 }]}>💬</Text>
          <Text style={[s.bbLabel, { color: C.red }]}>Get Help</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  navbar: { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14 },
  navBack: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  navTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  navBrand: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  hero: { height: 130, paddingHorizontal: 18, paddingBottom: 18, justifyContent: 'flex-end', overflow: 'hidden' },
  heroDeco: { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: C.red, opacity: 0.15 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  body: { paddingHorizontal: 14, paddingTop: 6 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  secLine: { width: 3, height: 16, borderRadius: 2 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: C.navy },
  card: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
  darkCard: { backgroundColor: C.navy, borderWidth: 0 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted },
  fieldLabelDark: { color: 'rgba(255,255,255,0.45)' },
  cardSubLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 4 },
  input: { backgroundColor: C.inputBg, borderRadius: 9, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  darkInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' },
  textarea: { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  currSymbol: { fontSize: 11, fontWeight: '700', color: C.gold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { backgroundColor: C.inputBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: C.border },
  chipText: { fontSize: 12, fontWeight: '600', color: C.muted },
  checkItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.inputBg, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'transparent' },
  checkItemActive: { backgroundColor: '#fff', borderColor: C.border },
  checkLabel: { fontSize: 13, fontWeight: '600', color: C.muted },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: C.red, borderColor: C.red },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  ctaBtn: { backgroundColor: C.red, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  ctaSub: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, paddingBottom: 8 },
  footerText: { fontSize: 13, color: C.muted },
  footerLink: { fontSize: 13, fontWeight: '700', color: C.red },
  bottomBar: { backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  bbItem: { alignItems: 'center', gap: 3 },
  bbIcon: { fontSize: 18 },
  bbLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.muted },
});