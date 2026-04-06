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

const VEHICLE_TYPES = ['Bike', 'Scooter', 'Car', 'Bicycle'] as const;
type VehicleType = typeof VEHICLE_TYPES[number];

const VEHICLE_ICONS: Record<VehicleType, string> = {
  Bike: '🏍️',
  Scooter: '🛵',
  Car: '🚗',
  Bicycle: '🚲',
};

export default function DeliverySignup() {
  // Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Vehicle info
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bike');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // License & documents
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState(''); // DD/MM/YYYY

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { signup, isLoading } = useAuthStore();

  const parseExpiry = (val: string): Date | undefined => {
    // Expect DD/MM/YYYY
    const parts = val.split('/');
    if (parts.length !== 3) return undefined;
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!plateNumber.trim() || !licenseNumber.trim()) {
      Alert.alert('Error', 'Plate number and license number are required');
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

    const expiryDate = licenseExpiry.trim() ? parseExpiry(licenseExpiry.trim()) : undefined;
    if (licenseExpiry.trim() && !expiryDate) {
      Alert.alert('Error', 'License expiry must be in DD/MM/YYYY format');
      return;
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
    <LinearGradient colors={['#a71215', '#e27373']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.badge}>Delivery Partner</Text>
            <Text style={styles.title}>Join Our Team</Text>
            <Text style={styles.subtitle}>Start earning with Foodie</Text>
          </View>

          <View style={styles.form}>

            {/* ── Personal Info ──────────────────── */}
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Field label="Full Name *">
              <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="#999"
                value={name} onChangeText={setName} autoComplete="name" />
            </Field>

            <Field label="Email *">
              <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="#999"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </Field>

            <Field label="Phone * (must be unique)">
              <TextInput style={styles.input} placeholder="+92 3XX XXXXXXX" placeholderTextColor="#999"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </Field>

            {/* ── Vehicle Info ───────────────────── */}
            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <Field label="Vehicle Type *">
              <View style={styles.chipRow}>
                {VEHICLE_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, vehicleType === type && styles.chipActive]}
                    onPress={() => setVehicleType(type)}
                  >
                    <Text style={styles.chipIcon}>{VEHICLE_ICONS[type]}</Text>
                    <Text style={[styles.chipText, vehicleType === type && styles.chipTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="Plate Number *">
                  <TextInput style={styles.input} placeholder="ABC-123" placeholderTextColor="#999"
                    value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Vehicle Color">
                  <TextInput style={styles.input} placeholder="e.g. Red" placeholderTextColor="#999"
                    value={vehicleColor} onChangeText={setVehicleColor} />
                </Field>
              </View>
            </View>

            <Field label="Vehicle Model">
              <TextInput style={styles.input} placeholder="e.g. Honda CD 70" placeholderTextColor="#999"
                value={vehicleModel} onChangeText={setVehicleModel} />
            </Field>

            {/* ── License ────────────────────────── */}
            <Text style={styles.sectionTitle}>License & Documents</Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="License Number *">
                  <TextInput style={styles.input} placeholder="LIC-XXXXXXX" placeholderTextColor="#999"
                    value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Expiry (DD/MM/YYYY)">
                  <TextInput style={styles.input} placeholder="31/12/2026" placeholderTextColor="#999"
                    value={licenseExpiry} onChangeText={setLicenseExpiry} keyboardType="numbers-and-punctuation" />
                </Field>
              </View>
            </View>

            {/* ── Emergency Contact ──────────────── */}
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Text style={styles.hint}>Optional — but recommended</Text>

            <Field label="Contact Name">
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#999"
                value={emergencyName} onChangeText={setEmergencyName} />
            </Field>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Field label="Contact Phone">
                  <TextInput style={styles.input} placeholder="+92 3XX XXXXXXX" placeholderTextColor="#999"
                    value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
                </Field>
              </View>
              <View style={styles.flex}>
                <Field label="Relation">
                  <TextInput style={styles.input} placeholder="e.g. Father" placeholderTextColor="#999"
                    value={emergencyRelation} onChangeText={setEmergencyRelation} />
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
              {isLoading ? <ActivityIndicator color="#6C5CE7" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a partner? </Text>
              <Pressable onPress={() => router.replace('/(auth)/delivery/login')}>
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
      <Text style={{ color: 'black', fontSize: 14, fontWeight: '600' }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backText: { color: 'black', fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 28 },
  badge: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'black', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  sectionTitle: { color: 'black', fontSize: 15, fontWeight: '800', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 4, marginTop: -4 },
  form: { gap: 14 },
  input: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: { backgroundColor: 'white', borderColor: 'white' },
  chipIcon: { fontSize: 16 },
  chipText: { color: 'white', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#6C5CE7' },
  button: { backgroundColor: 'rgba(251, 245, 245, 0.8)', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#6C5CE7', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  linkText: { color: '', fontSize: 14, fontWeight: '700' },
});
