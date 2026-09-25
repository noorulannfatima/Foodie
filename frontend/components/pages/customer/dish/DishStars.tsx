import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STAR_COLOR } from '@/components/atoms/Rating/Rating.styles';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export interface DishStarsProps {
  rating: number;
  size?: number;
}

/** Read-only row of five stars (halves allowed), with a translated screen-reader label. */
export default function DishStars({ rating, size = 14 }: DishStarsProps) {
  const t = useCustomerT();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={t('starsA11y', { rating: rating.toFixed(1).replace(/\.0$/, '') })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={STAR_COLOR}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
