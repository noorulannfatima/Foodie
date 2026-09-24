import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ReviewsList from '@/components/organisms/ReviewsList/ReviewsList';
import ReviewCard, { type ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';
import { ReviewsSummary } from '@/components/pages/reviews';
import { restaurantAPI } from '@/services/api/restaurant.api';
import type { RestaurantReview, RestaurantReviewsResponse } from '@/services/api/review.types';
import { Fonts, useAppThemeColors } from '@/constants/theme';

export default function RestaurantReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useAppThemeColors();

  const palette = useMemo<ReviewPalette>(
    () => ({ card: c.card, text: c.text, muted: c.muted, border: c.border, accent: c.primary }),
    [c],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.screenBackground, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
        },
        title: { fontFamily: Fonts.brandBlack, fontSize: 20, color: c.text },
        listContent: { paddingHorizontal: 20, paddingBottom: insets.bottom + 24 },
      }),
    [c, insets],
  );

  const [summary, setSummary] = useState<RestaurantReviewsResponse['summary'] | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    const res = await restaurantAPI.getReviews(page);
    setSummary(res.summary);
    return res;
  }, []);

  const renderReview = useCallback(
    (review: RestaurantReview) => (
      <ReviewCard
        title={review.dishName}
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
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ReviewsList
        fetchPage={fetchPage}
        renderReview={renderReview}
        palette={palette}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          summary ? (
            <ReviewsSummary
              averageRating={summary.averageRating}
              total={summary.totalReviews}
              noun="dish ratings"
              palette={palette}
            />
          ) : null
        }
      />
    </View>
  );
}
