import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack>
      {/* Tab navigator (home, search, cart, profile) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Restaurant detail */}
      <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />

      {/* Profile sub-screens */}
      <Stack.Screen name="personal-information" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
    </Stack>
  );
}