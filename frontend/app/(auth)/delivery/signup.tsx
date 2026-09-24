import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import {
  AuthScreen,
  AuthHeader,
  AuthForm,
  FormSection,
  Field,
  AuthInput,
  Row,
  Col,
  OptionTiles,
  StepProgress,
  PrimaryButton,
  FinePrint,
  LinkText,
  AuthFooter,
} from '@/components/auth/AuthKit';

const VEHICLE_TYPES = ['Bicycle', 'Scooter', 'Bike', 'Car'] as const;
type VehicleType = typeof VEHICLE_TYPES[number];
const VEHICLE_ICONS: Record<VehicleType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Bicycle: 'bicycle',
  Scooter: 'moped',
  Bike: 'motorbike',
  Car: 'car',
};
const STEPS = ['Personal & vehicle', 'License & security'];

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

  const footer = (
    <AuthFooter
      prompt="Already a partner?"
      linkLabel="Login"
      onPress={() => router.replace('/(auth)/delivery/login')}
    />
  );

  if (step === 1) {
    return (
      <AuthScreen key="step1">
        <AuthHeader title="Become a Rider" subtitle="Deliver joy, earn on your own schedule" />
        <StepProgress current={1} labels={STEPS} />

        <AuthForm>
          <Field label="Full name">
            <AuthInput placeholder="Enter your full name" value={name}
              onChangeText={setName} autoComplete="name" />
          </Field>
          <Field label="Email address">
            <AuthInput placeholder="Enter your email" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </Field>
          <Field label="Phone number">
            <AuthInput placeholder="+92 3XX XXXXXXX" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad" autoComplete="tel" />
          </Field>
        </AuthForm>

        <FormSection title="Vehicle">
          <Field label="Vehicle type">
            <OptionTiles
              options={VEHICLE_TYPES}
              value={vehicleType}
              onChange={setVehicle}
              renderIcon={(type, color) => (
                <MaterialCommunityIcons name={VEHICLE_ICONS[type]} size={26} color={color} />
              )}
            />
          </Field>
          <Row>
            <Col>
              <Field label="Plate number">
                <AuthInput placeholder="ABC-1234" value={plateNumber}
                  onChangeText={setPlate} autoCapitalize="characters" />
              </Field>
            </Col>
            <Col>
              <Field label="Color">
                <AuthInput placeholder="e.g. Black" value={vehicleColor} onChangeText={setVColor} />
              </Field>
            </Col>
          </Row>
          <Field label="Model (optional)">
            <AuthInput placeholder="e.g. Honda CD 70" value={vehicleModel} onChangeText={setVModel} />
          </Field>

          <PrimaryButton title="Continue" onPress={handleStep1} />
          <FinePrint>
            By continuing, you agree to Foodie's <LinkText>Terms of Service</LinkText> and{' '}
            <LinkText>Privacy Policy</LinkText>.
          </FinePrint>
          {footer}
        </FormSection>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen key="step2" onBack={() => setStep(1)}>
      <AuthHeader title="Complete Your Profile" subtitle="A few details to verify you on the road" />
      <StepProgress current={2} labels={STEPS} />

      <AuthForm>
        <Field label="License number">
          <AuthInput placeholder="DL-000-000-000" value={licenseNumber}
            onChangeText={setLicense} autoCapitalize="characters" />
        </Field>
        <Field label="License expiry (optional)" hint="Format: DD/MM/YYYY">
          <AuthInput placeholder="31/12/2027" value={licenseExpiry}
            onChangeText={setExpiry} keyboardType="numbers-and-punctuation" />
        </Field>
      </AuthForm>

      <FormSection title="Emergency contact" description="Optional, but recommended.">
        <Field label="Contact name">
          <AuthInput placeholder="Full name of contact" value={emergencyName} onChangeText={setEName} />
        </Field>
        <Row>
          <Col>
            <Field label="Phone">
              <AuthInput placeholder="+92 3XX XXXXXXX" value={emergencyPhone}
                onChangeText={setEPhone} keyboardType="phone-pad" />
            </Field>
          </Col>
          <Col>
            <Field label="Relation">
              <AuthInput placeholder="e.g. Father" value={emergencyRelation} onChangeText={setERelat} />
            </Field>
          </Col>
        </Row>
      </FormSection>

      <FormSection title="Account security">
        <Field label="Password">
          <AuthInput placeholder="Min 8 characters" value={password}
            onChangeText={setPassword} password autoComplete="new-password" />
        </Field>
        <Field label="Confirm password">
          <AuthInput placeholder="Re-enter your password" value={confirmPassword}
            onChangeText={setConfirm} password autoComplete="new-password" />
        </Field>

        <PrimaryButton title="Sign Up" onPress={handleSubmit} loading={isLoading} />
        {footer}
      </FormSection>
    </AuthScreen>
  );
}
