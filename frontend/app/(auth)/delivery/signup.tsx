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
};

// ─── Vehicle data ─────────────────────────────────────────────────────────────
const VEHICLE_TYPES = ['Bicycle', 'Scooter', 'Bike', 'Car'] as const;
type VehicleType = typeof VEHICLE_TYPES[number];
const VEHICLE_ICONS: Record<VehicleType, string> = {
  Bicycle: '🚲', Scooter: '🛵', Bike: '🏍️', Car: '🚗',
};

// ─── Reusable pieces ──────────────────────────────────────────────────────────
function SectionHead({ label, color = C.red }: { label: string; color?: string }) {
  return (
    <View style={s.secHead}>
      <View style={[s.secLine, { backgroundColor: color }]} />
      <Text style={s.secLabel}>{label}</Text>
    </View>
  );
}

function Card({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <View style={[s.card, dark && s.darkCard]}>{children}</View>
  );
}

function Field({
  label, children, dark = false,
}: { label: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={[s.fieldLabel, dark && { color: 'rgba(255,255,255,0.45)' }]}>{label}</Text>
      {children}
    </View>
  );
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <View style={s.stepWrap}>
      <View style={[s.stepDot, { backgroundColor: current >= 1 ? C.red : C.border }]} />
      <View style={[s.stepLine, { backgroundColor: current >= 2 ? C.red : C.border }]} />
      <View style={[s.stepDot, { backgroundColor: current >= 2 ? C.navy : C.border }]} />
      <Text style={s.stepNum}>Step {current} of 2</Text>
    </View>
  );
}

// ─── Main component (2-step) ──────────────────────────────────────────────────
export default function DeliverySignup() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 – personal + vehicle
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicle] = useState<VehicleType>('Bicycle');
  const [plateNumber, setPlate] = useState('');
  const [vehicleColor, setVColor] = useState('');
  const [vehicleModel, setVModel] = useState('');

  // Step 2 – documents + emergency + password
  const [licenseNumber, setLicense] = useState('');
  const [licenseExpiry, setExpiry] = useState('');
  const [emergencyName, setEName] = useState('');
  const [emergencyPhone, setEPhone] = useState('');
  const [emergencyRelation, setERelat] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');

  const { signup, isLoading } = useAuthStore();

  // ── Step 1 validation ──
  const handleStep1 = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all personal information'); return;
    }
    if (!plateNumber.trim()) {
      Alert.alert('Error', 'Plate number is required'); return;
    }
    setStep(2);
  };

  // ── Final submit ──
  const parseExpiry = (val: string): Date | undefined => {
    const parts = val.split('/');
    if (parts.length !== 3) return undefined;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const handleSubmit = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert('Error', 'License number is required'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters'); return;
    }
    const expiryDate = licenseExpiry.trim() ? parseExpiry(licenseExpiry.trim()) : undefined;
    if (licenseExpiry.trim() && !expiryDate) {
      Alert.alert('Error', 'License expiry must be DD/MM/YYYY'); return;
    }
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        vehicle: {
          type: vehicleType,
          plateNumber: plateNumber.trim().toUpperCase(),
          ...(vehicleModel.trim() && { model: vehicleModel.trim() }),
          ...(vehicleColor.trim() && { color: vehicleColor.trim() }),
        },
        licenseNumber: licenseNumber.trim().toUpperCase(),
        ...(expiryDate && { licenseExpiry: expiryDate }),
      };
      if (emergencyName.trim() && emergencyPhone.trim()) {
        payload.emergencyContact = {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          ...(emergencyRelation.trim() && { relation: emergencyRelation.trim() }),
        };
      }
      await signup(payload, 'delivery');
      router.replace('/(delivery)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Nav bar ── */}
      <View style={s.navbar}>
        <Pressable onPress={step === 2 ? () => setStep(1) : () => router.back()} hitSlop={10}>
          <Text style={s.navBack}>← Back</Text>
        </Pressable>
        <Text style={s.navTitle}>{step === 1 ? 'Join Our Team' : 'Verification'}</Text>
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
          {step === 1 ? (
            <>
              {/* ── Step 1 Hero ── */}
              <LinearGradient
                colors={[C.navy2, '#004d6e', C.orange]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.hero}
              >
                <View style={s.heroDeco} />
                <Text style={s.heroTitle}>Become a Culinary{'\n'}Messenger</Text>
                <Text style={s.heroSub}>Deliver joy, earn freedom</Text>
              </LinearGradient>

              <StepIndicator current={1} />

              <View style={s.body}>
                {/* Personal Info */}
                <SectionHead label="Personal Information" color={C.red} />
                <Card>
                  <Field label="FULL NAME">
                    <TextInput style={s.input} placeholder="e.g. Julian Casablancas"
                      placeholderTextColor={C.muted} value={name} onChangeText={setName}
                      autoComplete="name" />
                  </Field>
                  <Field label="EMAIL ADDRESS">
                    <TextInput style={s.input} placeholder="julian@foodie.com"
                      placeholderTextColor={C.muted} value={email} onChangeText={setEmail}
                      keyboardType="email-address" autoCapitalize="none" />
                  </Field>
                  <Field label="PHONE NUMBER">
                    <TextInput style={s.input} placeholder="+92 3XX XXXXXXX"
                      placeholderTextColor={C.muted} value={phone} onChangeText={setPhone}
                      keyboardType="phone-pad" />
                  </Field>
                </Card>

                {/* Vehicle Info */}
                <SectionHead label="Vehicle Information" color={C.gold} />
                <Card>
                  <Field label="VEHICLE TYPE">
                    <View style={s.vehicleGrid}>
                      {VEHICLE_TYPES.map(type => (
                        <Pressable
                          key={type}
                          style={[s.vehicleOpt, vehicleType === type && s.vehicleOptActive]}
                          onPress={() => setVehicle(type)}
                        >
                          <Text style={s.vehicleIcon}>{VEHICLE_ICONS[type]}</Text>
                          <Text style={[s.vehicleLabel, vehicleType === type && { color: C.red }]}>
                            {type.toUpperCase()}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </Field>
                  <View style={s.row2}>
                    <View style={{ flex: 1 }}>
                      <Field label="PLATE NUMBER">
                        <TextInput style={s.input} placeholder="ABC-1234"
                          placeholderTextColor={C.muted} value={plateNumber} onChangeText={setPlate}
                          autoCapitalize="characters" />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="VEHICLE COLOR">
                        <TextInput style={s.input} placeholder="e.g. Matte Black"
                          placeholderTextColor={C.muted} value={vehicleColor} onChangeText={setVColor} />
                      </Field>
                    </View>
                  </View>
                  <Field label="VEHICLE MODEL">
                    <TextInput style={s.input} placeholder="e.g. Honda CD 70"
                      placeholderTextColor={C.muted} value={vehicleModel} onChangeText={setVModel} />
                  </Field>
                </Card>

                <Pressable style={[s.ctaBtn, { backgroundColor: C.navy }]} onPress={handleStep1}>
                  <Text style={s.ctaBtnText}>Continue Application →</Text>
                </Pressable>
                <Text style={s.ctaSub}>
                  By continuing, you agree to FOODIE's{' '}
                  <Text style={{ color: C.red, fontWeight: '600' }}>Terms of Service</Text>
                  {'\n'}and Privacy Policy regarding partner data.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* ── Step 2 header ── */}
              <View style={s.step2Header}>
                <View>
                  <Text style={s.step2Tag}>STEP 02 OF 02</Text>
                  <Text style={s.step2Title}>Complete Your{'\n'}Profile</Text>
                </View>
                <View style={s.progressRing}>
                  <Text style={s.progressRingText}>2/2</Text>
                </View>
              </View>

              <StepIndicator current={2} />

              <View style={s.body}>
                {/* License & Documents */}
                <SectionHead label="License & Documents" color={C.orange} />
                <Card>
                  <Field label="LICENSE NUMBER">
                    <TextInput style={s.input} placeholder="DL-000-000-000"
                      placeholderTextColor={C.muted} value={licenseNumber} onChangeText={setLicense}
                      autoCapitalize="characters" />
                  </Field>
                  <Field label="EXPIRY DATE (DD/MM/YYYY)">
                    <TextInput style={s.input} placeholder="31/12/2026"
                      placeholderTextColor={C.muted} value={licenseExpiry} onChangeText={setExpiry}
                      keyboardType="numbers-and-punctuation" />
                  </Field>
                </Card>

                {/* Emergency Contact */}
                <SectionHead label="Emergency Contact" color={C.gold} />
                <Text style={s.hint}>Optional — but recommended</Text>
                <Card>
                  <Field label="CONTACT NAME">
                    <TextInput style={s.input} placeholder="Full name of contact"
                      placeholderTextColor={C.muted} value={emergencyName} onChangeText={setEName} />
                  </Field>
                  <View style={s.row2}>
                    <View style={{ flex: 1 }}>
                      <Field label="CONTACT PHONE">
                        <TextInput style={s.input} placeholder="+1 (000) 000"
                          placeholderTextColor={C.muted} value={emergencyPhone} onChangeText={setEPhone}
                          keyboardType="phone-pad" />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="RELATION">
                        <TextInput style={s.input} placeholder="e.g. Father"
                          placeholderTextColor={C.muted} value={emergencyRelation} onChangeText={setERelat} />
                      </Field>
                    </View>
                  </View>
                </Card>

                {/* Account Security */}
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

                {/* Hero banner bottom */}
                <LinearGradient
                  colors={[C.navy2, '#1a3a4a']}
                  style={s.bottomBanner}
                >
                  <Text style={s.bottomBannerTag}>JOIN THE FLEET</Text>
                  <Text style={s.bottomBannerTitle}>Deliver Joy,{'\n'}Earn Freedom</Text>
                </LinearGradient>

                <Pressable
                  style={[s.ctaBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.ctaBtnText}>Sign Up</Text>}
                </Pressable>

                <View style={s.footer}>
                  <Text style={s.footerText}>Already a partner? </Text>
                  <Pressable onPress={() => router.replace('/(auth)/delivery/login')}>
                    <Text style={s.footerLink}>Login</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        <Pressable style={s.bbItem}>
          <Text style={s.bbIcon}>💬</Text>
          <Text style={s.bbLabel}>Help</Text>
        </Pressable>
        <Pressable style={s.bbItem}>
          <Text style={[s.bbIcon, { fontSize: 16 }]}>💾</Text>
          <Text style={[s.bbLabel, { color: C.red }]}>Save Progress</Text>
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
  hero: { height: 120, paddingHorizontal: 18, paddingBottom: 18, justifyContent: 'flex-end', overflow: 'hidden' },
  heroDeco: { position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: C.orange, opacity: 0.18 },
  heroTitle: { fontSize: 21, fontWeight: '800', color: '#fff', lineHeight: 27 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '500' },
  stepWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  stepNum: { fontSize: 11, color: C.muted, fontWeight: '600', marginLeft: 4 },
  step2Header: { backgroundColor: C.cardBg, borderBottomWidth: 1, borderBottomColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  step2Tag: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 1, textTransform: 'uppercase' },
  step2Title: { fontSize: 22, fontWeight: '800', color: C.navy, marginTop: 4, lineHeight: 28 },
  progressRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: C.lightRed, alignItems: 'center', justifyContent: 'center' },
  progressRingText: { fontSize: 12, fontWeight: '800', color: C.red },
  body: { paddingHorizontal: 14, paddingTop: 4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
  secLine: { width: 3, height: 16, borderRadius: 2 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: C.navy },
  hint: { fontSize: 11, color: C.muted, marginTop: -4, marginBottom: 6, paddingHorizontal: 0 },
  card: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
  darkCard: { backgroundColor: C.navy, borderWidth: 0 },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted },
  input: { backgroundColor: C.inputBg, borderRadius: 9, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.text },
  row2: { flexDirection: 'row', gap: 10 },
  vehicleGrid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleOpt: { flex: 1, minWidth: '45%', backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, paddingVertical: 12, alignItems: 'center', gap: 5 },
  vehicleOptActive: { backgroundColor: C.lightRed, borderColor: C.red },
  vehicleIcon: { fontSize: 22 },
  vehicleLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted },
  bottomBanner: { borderRadius: 14, padding: 18, marginTop: 16 },
  bottomBannerTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 },
  bottomBannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 26 },
  ctaBtn: { backgroundColor: C.red, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  ctaSub: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 17 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, paddingBottom: 8 },
  footerText: { fontSize: 13, color: C.muted },
  footerLink: { fontSize: 13, fontWeight: '700', color: C.red },
  bottomBar: { backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  bbItem: { alignItems: 'center', gap: 3 },
  bbIcon: { fontSize: 18 },
  bbLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.muted },
});