import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STAR_COLOR } from '@/components/atoms/Rating/Rating.styles';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import type { MenuItemDetail } from '@/services/api/customer.api';
import DishStars from './DishStars';

export interface DishRatingSummaryProps {
  averageRating: number;
  breakdown: MenuItemDetail['reviews']['breakdown'];
}

/** Big average + stars + count, beside a 5→1 star bar chart. */
export default function DishRatingSummary({ averageRating, breakdown }: DishRatingSummaryProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const counts = (['5', '4', '3', '2', '1'] as const).map((star) => ({ star, count: breakdown[star] ?? 0 }));
  const total = counts.reduce((sum, r) => sum + r.count, 0);

  return (
    <View style={styles.box}>
      <View style={styles.average}>
        <Text style={styles.averageValue}>{averageRating.toFixed(1)}</Text>
        <DishStars rating={averageRating} />
        <Text style={styles.count}>{t(total === 1 ? 'ratingsCountOne' : 'ratingsCountOther', { count: total })}</Text>
      </View>
      <View style={styles.bars}>
        {counts.map(({ star, count }) => (
          <View key={star} style={styles.barRow} accessible accessibilityLabel={`${star}: ${count}`}>
            <Text style={styles.barLabel}>{star}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: total ? `${(count / total) * 100}%` : 0 }]} />
            </View>
            <Text style={styles.barCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.customerBodyBg,
    },
    average: {
      width: 92,
      alignItems: 'center',
      gap: 4,
    },
    averageValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 40,
      lineHeight: 44,
      color: c.customerTextPrimary,
    },
    count: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    bars: {
      flex: 1,
      gap: 6,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    barLabel: {
      width: 10,
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    track: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: c.isDark ? c.border : '#D5E0EC',
    },
    fill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: STAR_COLOR,
    },
    barCount: {
      width: 22,
      textAlign: 'right',
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
  });
}
