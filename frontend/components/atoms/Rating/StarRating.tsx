import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, STAR_COLOR } from '@/components/atoms/Rating/Rating.styles';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  /** Makes the stars tappable (unless `readonly` is true). */
  onRate?: (rating: number) => void;
  readonly?: boolean;
  /** Spoken before the value by screen readers, e.g. "Biryani". */
  label?: string;
}

/** Minimum touch target per star, in points. */
const MIN_TOUCH = 44;

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  onRate,
  readonly = true,
  label,
}: StarRatingProps) {
  const interactive = !!onRate && !readonly;

  if (!interactive) {
    return (
      <View
        style={styles.container}
        accessible
        accessibilityLabel={`${label ? `${label}: ` : ''}${rating} out of ${maxRating} stars`}
      >
        {Array.from({ length: maxRating }).map((_, index) => (
          <Ionicons
            key={index}
            name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
            size={size}
            color={STAR_COLOR}
          />
        ))}
      </View>
    );
  }

  // Pad each star so the tappable area is at least MIN_TOUCH, without spacing stars apart visually
  const pad = Math.max(0, (MIN_TOUCH - size) / 2);

  return (
    <View style={[styles.container, styles.interactive, { marginHorizontal: -pad }]}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const value = index + 1;
        const filled = value <= rating;
        return (
          <Pressable
            key={value}
            onPress={() => onRate(value)}
            style={({ pressed }) => [{ padding: pad }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${label ? `${label}: ` : ''}${value} star${value === 1 ? '' : 's'}`}
            accessibilityState={{ selected: value === rating }}
          >
            <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={STAR_COLOR} />
          </Pressable>
        );
      })}
    </View>
  );
}
