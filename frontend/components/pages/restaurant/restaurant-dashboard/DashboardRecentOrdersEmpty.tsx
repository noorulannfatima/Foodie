import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function DashboardRecentOrdersEmpty() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={48} color={Colors.light} />
      <Text style={styles.emptyText}>No recent orders</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.muted,
  },
});
