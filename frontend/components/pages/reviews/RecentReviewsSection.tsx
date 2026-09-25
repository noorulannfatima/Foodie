import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, type TextStyle } from 'react-native';
import ReviewCard, { type ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';
import { useReviewLabels } from '@/components/molecules/ReviewCard/ReviewLabels';
import { Fonts } from '@/constants/theme';

export interface RecentReview {
  id: string;
  rating: number;
  comment?: string;
  customerFirstName: string;
  createdAt: string;
  title?: string;
}

interface RecentReviewsSectionProps {
  reviews: RecentReview[] | null; // null while loading or on error
  onSeeAll: () => void;
  palette: ReviewPalette;
  /** Lets each dashboard keep its own section heading style. */
  titleStyle: TextStyle;
}

/** Dashboard block: the latest few reviews with a "See all" link. */
export default function RecentReviewsSection({
  reviews,
  onSeeAll,
  palette,
  titleStyle,
}: RecentReviewsSectionProps) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  const labels = useReviewLabels();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[titleStyle, styles.title]}>{labels.recentReviews}</Text>
        {reviews && reviews.length > 0 ? (
          <Pressable onPress={onSeeAll} hitSlop={12} accessibilityRole="link">
            <Text style={styles.seeAll}>{labels.seeAll}</Text>
          </Pressable>
        ) : null}
      </View>

      {reviews === null ? null : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{labels.noReviews}</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            title={review.title}
            rating={review.rating}
            comment={review.comment}
            customerFirstName={review.customerFirstName}
            createdAt={review.createdAt}
            palette={palette}
          />
        ))
      )}
    </View>
  );
}

function createStyles(p: ReviewPalette) {
  return StyleSheet.create({
    section: {
      marginTop: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    // The header row owns the spacing below the title
    title: {
      marginBottom: 0,
    },
    seeAll: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: p.accent,
    },
    empty: {
      backgroundColor: p.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: p.muted,
    },
  });
}
