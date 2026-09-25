import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export default function SearchNoResults() {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.noResults}>
      <Ionicons name="search-outline" size={48} color={c.muted} />
      <Text style={styles.noResultsTitle}>{t('noResults')}</Text>
      <Text style={styles.noResultsText}>{t('noResultsHint')}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    noResults: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    noResultsTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 18,
      color: c.text,
    },
    noResultsText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
