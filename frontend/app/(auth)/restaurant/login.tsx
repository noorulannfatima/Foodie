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
  SocialAuth,
  AuthFooter,
} from '@/components/auth/AuthKit';

export default function RestaurantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password, 'restaurant');
      router.replace('/(restaurant)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader title="Welcome Back" subtitle="Sign in to manage your restaurant" />

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

        <Field
          label="Password"
          action={{
            label: 'Forgot?',
            onPress: () => router.push('/(auth)/forgot-password?role=restaurant'),
          }}
        >
          <AuthInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            password
            autoComplete="password"
          />
        </Field>

        <PrimaryButton title="Login" onPress={handleLogin} loading={isLoading} />

        <SocialAuth />

        <AuthFooter
          prompt="New restaurant?"
          linkLabel="Register Here"
          onPress={() => router.replace('/(auth)/restaurant/signup')}
        />
      </AuthForm>
    </AuthScreen>
  );
}
