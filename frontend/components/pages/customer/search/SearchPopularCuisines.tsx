import { useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { POPULAR_CUISINES } from './constants';

export interface SearchPopularCuisinesProps {
  onSelectCuisine: (label: string) => void;
}

export default function SearchPopularCuisines({ onSelectCuisine }: SearchPopularCuisinesProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <>
      <Text style={styles.sectionTitle}>Popular cuisines</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineRow}>
        {POPULAR_CUISINES.map((item) => (
          <TouchableOpacity key={item.label} style={styles.cuisineItem} onPress={() => onSelectCuisine(item.label)}>
            <Image source={{ uri: item.image }} style={styles.cuisineImage} />
            <Text style={styles.cuisineLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sectionTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
      marginBottom: 12,
      marginTop: 16,
    },
    cuisineRow: {
      marginBottom: 8,
    },
    cuisineItem: {
      alignItems: 'center',
      marginRight: 16,
      width: 80,
    },
    cuisineImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.card,
      marginBottom: 6,
    },
    cuisineLabel: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.text,
      textAlign: 'center',
    },
  });
}
