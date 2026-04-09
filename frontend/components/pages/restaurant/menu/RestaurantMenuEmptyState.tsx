import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export default function RestaurantMenuEmptyState() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color={c.light} />
      <Text style={styles.emptyTitle}>No Menu Items</Text>
      <Text style={styles.emptySubtext}>Add your first menu item to get started.</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 18,
      color: c.text,
      marginTop: 8,
    },
    emptySubtext: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
