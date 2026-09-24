import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ReviewsList from '@/components/organisms/ReviewsList/ReviewsList';
import ReviewCard from '@/components/molecules/ReviewCard/ReviewCard';
import { ReviewsSummary } from '@/components/pages/reviews';
import { deliveryAPI } from '@/services/api/delivery.api';
import type { DeliveryReview, DeliveryReviewsResponse } from '@/services/api/review.types';
import { DeliveryLayout, getDeliveryTabTheme } from '@/constants/deliveryTheme';
import { getDeliveryReviewPalette } from '@/constants/deliveryReviewPalette';
import { useAppThemeStore } from '@/stores/appThemeStore';

export default function DeliveryReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useAppThemeStore((s) => s.isDark);
  const theme = useMemo(() => getDeliveryTabTheme(isDark), [isDark]);
  const palette = useMemo(() => getDeliveryReviewPalette(theme), [theme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.pageBg, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: DeliveryLayout.screenPaddingH,
          paddingVertical: 12,
        },
        title: { fontSize: 20, fontWeight: '800', color: theme.navy },
        listContent: {
          paddingHorizontal: DeliveryLayout.screenPaddingH,
          paddingBottom: insets.bottom + 24,
        },
      }),
    [theme, insets],
  );

  const [summary, setSummary] = useState<DeliveryReviewsResponse['summary'] | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    const res = await deliveryAPI.getReviews(page);
    setSummary(res.summary);
    return res;
  }, []);

  const renderReview = useCallback(
    (review: DeliveryReview) => (
      <ReviewCard
        title={review.orderNumber ? `Order #${review.orderNumber}` : undefined}
        rating={review.rating}
        comment={review.comment}
        customerFirstName={review.customerFirstName}
        createdAt={review.createdAt}
        palette={palette}
      />
    ),
    [palette],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={theme.navy} />
        </Pressable>
        <Text style={styles.title}>My Ratings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ReviewsList
        fetchPage={fetchPage}
        renderReview={renderReview}
        palette={palette}
        contentContainerStyle={styles.listContent}
        emptyMessage="No ratings yet. Customers can rate you after each delivery."
        ListHeaderComponent={
          summary ? (
            <ReviewsSummary
              averageRating={summary.averageRating}
              total={summary.totalRatings}
              noun="ratings"
              palette={palette}
            />
          ) : null
        }
      />
    </View>
  );
}
