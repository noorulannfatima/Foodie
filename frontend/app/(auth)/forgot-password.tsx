import { useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authAPI } from '@/services/api/auth.api';
import {
  AuthScreen,
  AuthHeader,
  AuthForm,
  Field,
  AuthInput,
  PrimaryButton,
  AuthFooter,
} from '@/components/auth/AuthKit';

type UserRole = 'customer' | 'restaurant' | 'delivery';

export default function ForgotPassword() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = (['customer', 'restaurant', 'delivery'].includes(params.role ?? '')
    ? params.role
    : 'customer') as UserRole;

  // 'request' = ask for email, 'reset' = enter code + new password
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim().toLowerCase(), role);
      setStep('reset');
      // DEV: backend returns the code directly. Surface it so it can be tested
      // without an email provider. Remove once real email delivery is wired up.
      if (res?.devCode) {
        setCode(String(res.devCode));
        Alert.alert('Reset code (dev)', `Your code is ${res.devCode}`);
      } else {
        Alert.alert(
          'Check your email',
          'If an account exists for this email, a reset code has been sent.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.resetPassword(email.trim().toLowerCase(), code.trim(), newPassword, role);
      Alert.alert('Success', 'Your password has been reset. Please log in.', [
        { text: 'OK', onPress: () => router.replace(`/(auth)/${role}/login`) },
      ]);
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader
        title={step === 'request' ? 'Forgot Password' : 'Reset Password'}
        subtitle={
          step === 'request'
            ? 'Enter your email and we’ll send you a reset code'
            : `Enter the code sent to ${email} and choose a new password`
        }
      />

      <AuthForm>
        {step === 'request' ? (
          <>
            <Field label="Email address">
              <AuthInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </Field>

            <PrimaryButton title="Send Reset Code" onPress={handleRequestCode} loading={isLoading} />
          </>
        ) : (
          <>
            <Field
              label="Reset code"
              action={{ label: 'Resend', onPress: () => { if (!isLoading) handleRequestCode(); } }}
            >
              <AuthInput
                placeholder="6-digit code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                editable={!isLoading}
              />
            </Field>

            <Field label="New password">
              <AuthInput
                placeholder="At least 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                password
                autoComplete="new-password"
                editable={!isLoading}
              />
            </Field>

            <Field label="Confirm password">
              <AuthInput
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                password
                autoComplete="new-password"
                editable={!isLoading}
              />
            </Field>

            <PrimaryButton title="Reset Password" onPress={handleResetPassword} loading={isLoading} />
          </>
        )}

        <AuthFooter
          prompt="Remembered your password?"
          linkLabel="Log In"
          onPress={() => router.replace(`/(auth)/${role}/login`)}
        />
      </AuthForm>
    </AuthScreen>
  );
}
