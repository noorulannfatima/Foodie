import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';

export default function HomePopularEmpty() {
  const c = useAppThemeColors(); // empty state icon/text adapt to theme
  const styles = useMemo(() => createEmptyStyles(c), [c]);

  return (
    <View style={styles.emptySection}>
      <Ionicons name="restaurant-outline" size={40} color={c.customerBorder} />
      <Text style={styles.emptyText}>No restaurants found</Text>
    </View>
  );
}

function createEmptyStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    emptySection: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
    },
  });
}
