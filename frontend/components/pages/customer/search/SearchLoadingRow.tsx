import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spinner } from '@/components/atoms';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export default function SearchLoadingRow() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.loadingRow}>
      <Spinner size="small" />
      <Text style={styles.loadingText}>Searching...</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 20,
    },
    loadingText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
