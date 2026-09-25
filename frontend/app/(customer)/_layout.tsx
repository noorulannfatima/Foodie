import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAppThemeColors } from '@/constants/theme';
import { useCustomerPreferencesStore } from '@/stores/customerPreferencesStore';
import { useAddressStore } from '@/stores/addressStore';
import {
  getCustomerPushRoute,
  registerCustomerPushNotifications,
} from '@/services/pushNotifications';

function openFromNotification(response: Notifications.NotificationResponse) {
  const route = getCustomerPushRoute(response.notification.request.content.data);
  if (route) router.push(route);
}

export default function CustomerLayout() {
  const c = useAppThemeColors();

  useEffect(() => {
    registerCustomerPushNotifications();
    // Server copy wins over the device cache (e.g. language changed on another phone)
    useCustomerPreferencesStore.getState().load().catch(() => {});
    useAddressStore.getState().load().catch(() => {});

    // App was launched by tapping a notification: handle it once, then clear it
    const launchResponse = Notifications.getLastNotificationResponse();
    if (launchResponse) {
      openFromNotification(launchResponse);
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response);
      Notifications.clearLastNotificationResponse();
    });
    return () => subscription.remove();
  }, []);

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
        <Stack.Screen name="dish/[itemId]" options={{ headerShown: false }} />
        <Stack.Screen name="dish/reviews" options={{ headerShown: false }} />

        {/* Profile sub-screens */}
        <Stack.Screen name="personal-information" options={{ headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
        <Stack.Screen name="addresses" options={{ headerShown: false }} />

        {/* Orders */}
        <Stack.Screen name="orders/index" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
