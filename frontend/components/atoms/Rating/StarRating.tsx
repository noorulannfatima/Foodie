import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/components/atoms/Rating/Rating.styles';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  onRate,
  readonly = true,
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
          size={size}
          color="#FFA94D"
        />
      ))}
    </View>
  );
}
