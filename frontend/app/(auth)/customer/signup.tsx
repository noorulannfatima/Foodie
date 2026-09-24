import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import {
  AuthScreen,
  AuthHeader,
  AuthForm,
  Field,
  AuthInput,
  CheckboxRow,
  LinkText,
  PrimaryButton,
  SocialAuth,
  AuthFooter,
} from '@/components/auth/AuthKit';

export default function CustomerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signup, isLoading } = useAuthStore();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to Terms of Service and Privacy Policy');
      return;
    }

    try {
      await signup(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
        },
        'customer',
      );
      router.replace('/(customer)/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader title="Create Account" subtitle="Join Foodie today" />

      <AuthForm>
        <Field label="Full name">
          <AuthInput
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        </Field>

        <Field label="Email address">
          <AuthInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone number (optional)">
          <AuthInput
            placeholder="+92 3XX XXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </Field>

        <Field label="Password">
          <AuthInput
            placeholder="Min 8 characters"
            value={password}
            onChangeText={setPassword}
            password
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm password">
          <AuthInput
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            password
            autoComplete="new-password"
          />
        </Field>

        <CheckboxRow checked={agreedToTerms} onToggle={() => setAgreedToTerms(!agreedToTerms)}>
          By signing up, you agree to our <LinkText>Terms of Service</LinkText> and{' '}
          <LinkText>Privacy Policy</LinkText>.
        </CheckboxRow>

        <PrimaryButton title="Sign Up" onPress={handleSignup} loading={isLoading} />

        <SocialAuth />

        <AuthFooter
          prompt="Already have an account?"
          linkLabel="Login"
          onPress={() => router.replace('/(auth)/customer/login')}
        />
      </AuthForm>
    </AuthScreen>
  );
}
