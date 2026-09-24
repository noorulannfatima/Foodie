import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useAuthStore } from '@/stores/authStore';
import InactivityProvider from '@/components/InactivityProvider';

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);

  // Keys match the family names in constants/theme `Fonts`.
  const [fontsLoaded, fontError] = useFonts({
    Nunito: Nunito_400Regular,
    Nunito_700Bold,
    Nunito_900Black,
  });

  // Restore any saved session when the app starts.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Hold the first frame until the brand font is ready; fall back to system on error.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <InactivityProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </InactivityProvider>
    </SafeAreaProvider>
  );
}
