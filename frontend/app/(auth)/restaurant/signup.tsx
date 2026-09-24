import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
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
  ChoiceChips,
  PrimaryButton,
  FinePrint,
  LinkText,
  AuthFooter,
} from '@/components/auth/AuthKit';

const CUISINE_OPTIONS = [
  'Pakistani', 'Chinese', 'Fast Food', 'BBQ', 'Italian',
  'Indian', 'Continental', 'Desi', 'Burgers', 'Pizza',
  'Seafood', 'Desserts', 'Bakery', 'Healthy',
];
const DELIVERY_OPTIONS = ['Delivery', 'Pickup', 'Dine-in'] as const;
const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;
type DeliveryOption = typeof DELIVERY_OPTIONS[number];
type PaymentOption = typeof PAYMENT_OPTIONS[number];

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

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
    <AuthScreen>
      <AuthHeader title="Register Restaurant" subtitle="Start your culinary journey on Foodie" />

      <AuthForm>
        <Field label="Restaurant name">
          <AuthInput placeholder="e.g. The Golden Saffron" value={name} onChangeText={setName} />
        </Field>
        <Field label="Email address">
          <AuthInput
            placeholder="contact@restaurant.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone number">
          <AuthInput
            placeholder="+92 3XX XXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="Description" hint="At least 10 characters">
          <AuthInput
            placeholder="Tell customers about your food…"
            value={description}
            onChangeText={setDesc}
            multiline
            numberOfLines={3}
          />
        </Field>
      </AuthForm>

      <FormSection title="Location">
        <Field label="Street / area">
          <AuthInput placeholder="123 Culinary Avenue" value={street} onChangeText={setStreet} />
        </Field>
        <Row>
          <Col>
            <Field label="City">
              <AuthInput placeholder="City" value={city} onChangeText={setCity} />
            </Field>
          </Col>
          <Col width={120}>
            <Field label="ZIP code">
              <AuthInput
                placeholder="00000"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="number-pad"
              />
            </Field>
          </Col>
        </Row>
      </FormSection>

      <FormSection title="Cuisine" description="Select everything you serve.">
        <ChoiceChips
          options={CUISINE_OPTIONS}
          selected={cuisineTypes}
          onToggle={v => setCuisines(p => toggle(p, v))}
        />
      </FormSection>

      <FormSection title="Service">
        <Field label="Order types">
          <ChoiceChips
            options={DELIVERY_OPTIONS}
            selected={deliveryOptions}
            onToggle={v => setDelivery(p => toggle(p, v))}
          />
        </Field>
        <Field label="Payment methods">
          <ChoiceChips
            options={PAYMENT_OPTIONS}
            selected={paymentMethods}
            onToggle={v => setPayment(p => toggle(p, v))}
          />
        </Field>
        <Row>
          <Col>
            <Field label="Min. order">
              <AuthInput prefix="PKR" placeholder="100" value={minimumOrder}
                onChangeText={setMinOrder} keyboardType="number-pad" />
            </Field>
          </Col>
          <Col>
            <Field label="Delivery fee">
              <AuthInput prefix="PKR" placeholder="50" value={deliveryFee}
                onChangeText={setFee} keyboardType="number-pad" />
            </Field>
          </Col>
        </Row>
        <Row>
          <Col>
            <Field label="Radius (km)">
              <AuthInput placeholder="5" value={deliveryRadius}
                onChangeText={setRadius} keyboardType="number-pad" />
            </Field>
          </Col>
          <Col>
            <Field label="Est. time (min)">
              <AuthInput placeholder="30" value={estTime}
                onChangeText={setEstTime} keyboardType="number-pad" />
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

        <PrimaryButton title="Register Restaurant" onPress={handleSignup} loading={isLoading} />
        <FinePrint>
          By registering, you agree to our <LinkText>Terms of Service</LinkText>.
        </FinePrint>

        <AuthFooter
          prompt="Already registered?"
          linkLabel="Login"
          onPress={() => router.replace('/(auth)/restaurant/login')}
        />
      </FormSection>
    </AuthScreen>
  );
}
