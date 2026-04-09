import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { getDeliveryTabTheme } from '@/constants/deliveryTheme';
import { useDeliveryPreferencesStore } from '@/stores/deliveryPreferencesStore';

export default function DeliveryLayout() {
  const darkMode = useDeliveryPreferencesStore((s) => s.darkMode);
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
