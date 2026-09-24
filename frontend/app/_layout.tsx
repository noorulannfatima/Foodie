import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import InactivityProvider from '@/components/InactivityProvider';

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);

  // Restore any saved session when the app starts.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <SafeAreaProvider>
      <InactivityProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </InactivityProvider>
    </SafeAreaProvider>
  );
}
