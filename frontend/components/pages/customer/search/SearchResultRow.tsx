import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import type { SearchRestaurantResult } from './types';

export interface SearchResultRowProps {
  restaurant: SearchRestaurantResult;
  formatCurrency: (amount: number) => string;
  onPress: () => void;
}

export default function SearchResultRow({ restaurant: r, formatCurrency, onPress }: SearchResultRowProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress}>
      {r.image?.[0] ? (
        <Image source={{ uri: r.image[0] }} style={styles.resultImage} />
      ) : (
        <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
          <Ionicons name="restaurant" size={24} color={c.muted} />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{r.name}</Text>
        <Text style={styles.resultCuisine}>{r.cuisineTypes.join(' • ')}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.resultRating}>{r.averageRating.toFixed(1)}</Text>
          <Text style={styles.resultDot}>•</Text>
          <Text style={styles.resultDelivery}>
            {r.deliveryFee === 0 ? 'Free Delivery' : formatCurrency(r.deliveryFee)}
          </Text>
          <Text style={styles.resultDot}>•</Text>
          <Text style={styles.resultTime}>{r.estimatedDeliveryTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    resultCard: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    resultImage: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: c.card,
    },
    resultImagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultInfo: {
      flex: 1,
      justifyContent: 'center',
      gap: 3,
    },
    resultName: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    resultCuisine: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
    resultMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    resultRating: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.text,
    },
    resultDot: {
      color: c.muted,
      fontSize: 10,
    },
    resultDelivery: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
    resultTime: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
    },
  });
}
