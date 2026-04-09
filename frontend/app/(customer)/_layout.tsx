import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAppThemeColors } from '@/constants/theme';

export default function CustomerLayout() {
  const c = useAppThemeColors();

  return (
    <View style={[styles.flex, { backgroundColor: c.customerBodyBg }]}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: c.customerBodyBg },
        }}
      >
        {/* Tab navigator (home, search, cart, profile) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Restaurant detail */}
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />

        {/* Profile sub-screens */}
        <Stack.Screen name="personal-information" options={{ headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
