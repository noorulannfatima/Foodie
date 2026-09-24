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
  PrimaryButton,
} from '@/components/auth/AuthKit';

// Admin accounts are created with `npm run create:admin` on the backend,
// so there is no signup link or password reset here.
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password, 'admin');
      router.replace('/(admin)/(tabs)/overview');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader title="Foodie Admin" subtitle="Sign in to manage payouts and restaurants" />

      <AuthForm>
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

        <Field label="Password">
          <AuthInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            password
            autoComplete="password"
          />
        </Field>

        <PrimaryButton title="Login" onPress={handleLogin} loading={isLoading} />
      </AuthForm>
    </AuthScreen>
  );
}
