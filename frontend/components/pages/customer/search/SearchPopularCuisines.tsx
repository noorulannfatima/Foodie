import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { POPULAR_CUISINES } from './constants';

export interface SearchPopularCuisinesProps {
  onSelectCuisine: (label: string) => void;
}

export default function SearchPopularCuisines({ onSelectCuisine }: SearchPopularCuisinesProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Popular cuisines</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cuisineRow}>
        {POPULAR_CUISINES.map((c) => (
          <TouchableOpacity key={c.label} style={styles.cuisineItem} onPress={() => onSelectCuisine(c.label)}>
            <Image source={{ uri: c.image }} style={styles.cuisineImage} />
            <Text style={styles.cuisineLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
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
    backgroundColor: '#F5F5F5',
    marginBottom: 6,
  },
  cuisineLabel: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.dark,
    textAlign: 'center',
  },
});
