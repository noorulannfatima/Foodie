import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useRestaurantT } from '@/constants/restaurantStrings';

export default function MenuBuilderTitle() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const t = useRestaurantT();
  return (
    <View style={styles.titleRow}>
      <View>
        <Text style={styles.titleMain} accessibilityRole="header">
          {t('menuTitle')}
        </Text>
        <Text style={styles.titleSub}>{t('menuSubtitle')}</Text>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    titleRow: {
      marginBottom: 16,
    },
    titleMain: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28, // matches the Dashboard and Orders page headings
      color: c.text,
    },
    titleSub: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
      marginTop: 4,
    },
  });
}
