import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, tintBg, BRAND_RED_TINT, type AppColors } from '@/constants/theme';
import { useCustomerPreferencesStore } from '@/stores/customerPreferencesStore';
import type { DishReview } from '@/services/api/customer.api';
import DishStars from './DishStars';

/** "12 Sep", with the year when it isn't this year. */
export function formatReviewDay(iso: string, language: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(language, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
}

export interface DishReviewItemProps {
  review: DishReview;
  /** Card look for the all-reviews list; a divided row on the dish page. */
  variant?: 'row' | 'card';
}

export default function DishReviewItem({ review, variant = 'row' }: DishReviewItemProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const language = useCustomerPreferencesStore((s) => s.language);

  return (
    <View style={variant === 'card' ? styles.card : styles.row}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: tintBg(c.brand, BRAND_RED_TINT, c.isDark) }]}>
          <Text style={styles.avatarText}>{review.customerFirstName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>
            {review.customerFirstName}
          </Text>
          <DishStars rating={review.rating} size={12} />
        </View>
        <Text style={styles.date}>{formatReviewDay(review.createdAt, language)}</Text>
      </View>
      <Text style={styles.comment}>{review.comment}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      gap: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.customerBorder,
    },
    card: {
      gap: 8,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.customerSurface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.primary,
    },
    who: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.customerTextPrimary,
    },
    date: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    comment: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      lineHeight: 21,
      color: c.customerTextSecondary,
    },
  });
}
