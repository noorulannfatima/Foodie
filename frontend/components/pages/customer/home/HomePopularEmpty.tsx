import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function HomePopularEmpty() {
  return (
    <View style={styles.emptySection}>
      <Ionicons name="restaurant-outline" size={40} color="#ccc" />
      <Text style={styles.emptyText}>No restaurants found</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.brand,
    color: Colors.muted,
  },
});
