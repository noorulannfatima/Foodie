import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAppThemeColors } from '@/constants/theme';
import { useRestaurantLocale, useRestaurantT } from '@/constants/restaurantStrings';
import {
  ReviewLabelsProvider,
  type ReviewLabels,
} from '@/components/molecules/ReviewCard/ReviewLabels';
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
  const t = useRestaurantT();
  const locale = useRestaurantLocale();

  const reviewLabels = useMemo<ReviewLabels>(
    () => ({
      justNow: t('justNow'),
      minutesAgo: (count) => t('minutesAgo', { count }),
      hoursAgo: (count) => t('hoursAgo', { count }),
      daysAgo: (count) => t('daysAgo', { count }),
      locale,
      recentReviews: t('recentReviews'),
      seeAll: t('seeAll'),
      noReviews: t('noReviews'),
      loadFailed: t('reviewsLoadFailed'),
      retry: t('retry'),
    }),
    [t, locale],
  );

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
    <ReviewLabelsProvider value={reviewLabels}>
      <View style={[styles.flex, { backgroundColor: c.screenBackground }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.screenBackground },
          }}
        />
      </View>
    </ReviewLabelsProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
