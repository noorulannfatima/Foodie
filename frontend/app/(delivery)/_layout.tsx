import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { getDeliveryTabTheme } from '@/constants/deliveryTheme';
import { useAppThemeStore } from '@/stores/appThemeStore';

export default function DeliveryLayout() {
  const darkMode = useAppThemeStore((s) => s.isDark); // shared with customer/restaurant via persisted store
  const theme = getDeliveryTabTheme(darkMode);
  return (
    <View style={[styles.flex, { backgroundColor: theme.pageBg }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.pageBg },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
