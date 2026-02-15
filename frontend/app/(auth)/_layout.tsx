import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="customer/login" options={{ headerShown: false }} />
      <Stack.Screen name="customer/signup" options={{ headerShown: false }} />
      <Stack.Screen name="delivery/login" options={{ headerShown: false }} />
      <Stack.Screen name="delivery/signup" options={{ headerShown: false }} />
      <Stack.Screen name="restaurant/login" options={{ headerShown: false }} />
      <Stack.Screen name="restaurant/signup" options={{ headerShown: false }} />
    </Stack>
  );    
}
