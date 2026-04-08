import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function SearchNoResults() {
  return (
    <View style={styles.noResults}>
      <Ionicons name="search-outline" size={48} color="#ccc" />
      <Text style={styles.noResultsTitle}>No results found</Text>
      <Text style={styles.noResultsText}>Try a different search term</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  noResultsTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.dark,
  },
  noResultsText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
});
