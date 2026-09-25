import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StarRating from '@/components/atoms/Rating/StarRating';
import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';
import { Fonts } from '@/constants/theme';

interface ReviewsSummaryProps {
  averageRating: number;
  total: number;
  /** e.g. "reviews" or "ratings" */
  noun: string;
  /** Singular form; defaults to `noun` without its trailing "s". */
  singularNoun?: string;
  palette: ReviewPalette;
}

/** Big average + stars + count, shown above a reviews list. */
export default function ReviewsSummary({
  averageRating,
  total,
  noun,
  singularNoun = noun.replace(/s$/, ''),
  palette,
}: ReviewsSummaryProps) {
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View style={styles.card}>
      <Text style={styles.average}>{total > 0 ? averageRating.toFixed(1) : '–'}</Text>
      <View style={styles.side}>
        <StarRating rating={averageRating} size={18} />
        <Text style={styles.count}>
          {total} {total === 1 ? singularNoun : noun}
        </Text>
      </View>
    </View>
  );
}

function createStyles(p: ReviewPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: p.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      padding: 18,
      marginBottom: 16,
    },
    average: {
      fontFamily: Fonts.brandBlack,
      fontSize: 44,
      color: p.text,
    },
    side: {
      gap: 6,
    },
    count: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: p.muted,
    },
  });
}
