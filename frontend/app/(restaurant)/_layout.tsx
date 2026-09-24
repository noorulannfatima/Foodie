import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAppThemeColors } from '@/constants/theme';
import {
  getRestaurantPushRoute,
  registerRestaurantPushNotifications,
} from '@/services/pushNotifications';

function openFromNotification(response: Notifications.NotificationResponse) {
  const route = getRestaurantPushRoute(response.notification.request.content.data);
  if (route) router.navigate(route);
}

export default function RestaurantLayout() {
  const c = useAppThemeColors();

  useEffect(() => {
    registerRestaurantPushNotifications();

    // App was launched by tapping a notification: handle it once, then clear it
    // so re-entering this layout doesn't navigate again
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
    <View style={[styles.flex, { backgroundColor: c.screenBackground }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.screenBackground },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
