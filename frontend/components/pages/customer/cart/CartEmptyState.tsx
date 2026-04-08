import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface CartEmptyStateProps {
  onBrowseRestaurants: () => void;
}

export default function CartEmptyState({ onBrowseRestaurants }: CartEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
      <Text style={styles.emptySubtext}>Add items from a restaurant to get started</Text>
      <TouchableOpacity style={styles.browseBtn} onPress={onBrowseRestaurants}>
        <Text style={styles.browseBtnText}>Browse Restaurants</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  emptyTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 22,
    color: Colors.dark,
  },
  emptySubtext: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
});
