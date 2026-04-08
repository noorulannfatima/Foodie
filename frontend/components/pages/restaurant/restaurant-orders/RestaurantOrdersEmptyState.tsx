import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface RestaurantOrdersEmptyStateProps {
  activeFilter: string;
}

export default function RestaurantOrdersEmptyState({ activeFilter }: RestaurantOrdersEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={Colors.light} />
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptySubtext}>
        {activeFilter === 'All'
          ? 'Orders will appear here when customers place them.'
          : `No ${activeFilter.toLowerCase()} orders right now.`}
      </Text>
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
    textAlign: 'center',
    maxWidth: 250,
  },
});
