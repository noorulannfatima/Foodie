import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function RestaurantMenuEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color={Colors.light} />
      <Text style={styles.emptyTitle}>No Menu Items</Text>
      <Text style={styles.emptySubtext}>Add your first menu item to get started.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 18,
    color: Colors.dark,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
});
