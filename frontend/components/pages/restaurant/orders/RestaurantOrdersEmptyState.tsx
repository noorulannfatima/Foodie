import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useRestaurantLocale, useRestaurantT } from '@/constants/restaurantStrings';
import { statusFilterLabel } from './constants';

export interface RestaurantOrdersEmptyStateProps {
  activeFilter: string;
}

export default function RestaurantOrdersEmptyState({ activeFilter }: RestaurantOrdersEmptyStateProps) {
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const locale = useRestaurantLocale();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={c.light} />
      <Text style={styles.emptyTitle}>{t('ordersEmptyTitle')}</Text>
      <Text style={styles.emptySubtext}>
        {activeFilter === 'All'
          ? t('ordersEmptyAll')
          : t('ordersEmptyFiltered', {
              status: statusFilterLabel(activeFilter, t).toLocaleLowerCase(locale),
            })}
      </Text>
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
      textAlign: 'center',
      maxWidth: 250,
    },
  });
}
