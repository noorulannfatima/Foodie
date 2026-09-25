import { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useRestaurantT } from '@/constants/restaurantStrings';

export default function OrderPipelineTitle() {
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const styles = useMemo(() => createStyles(c), [c]);
  return <Text style={styles.pipelineTitle}>{t('ordersPipelineTitle')}</Text>;
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    pipelineTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
  });
}
