import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export default function DashboardRecentOrdersEmpty() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={48} color={c.light} />
      <Text style={styles.emptyText}>No recent orders</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    emptyText: {
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.muted,
    },
  });
}
