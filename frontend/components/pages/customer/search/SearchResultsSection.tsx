import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import SearchResultRow from './SearchResultRow';
import type { SearchRestaurantResult } from './types';

export interface SearchResultsSectionProps {
  results: SearchRestaurantResult[];
  formatCurrency: (amount: number) => string;
  onSelectRestaurant: (id: string) => void;
}

export default function SearchResultsSection({
  results,
  formatCurrency,
  onSelectRestaurant,
}: SearchResultsSectionProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Results ({results.length})</Text>
      {results.map((r) => (
        <SearchResultRow
          key={r._id}
          restaurant={r}
          formatCurrency={formatCurrency}
          onPress={() => onSelectRestaurant(r._id)}
        />
      ))}
    </View>
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
});
