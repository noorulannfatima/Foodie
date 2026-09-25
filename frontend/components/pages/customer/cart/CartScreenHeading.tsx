import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export interface CartScreenHeadingProps {
  restaurantName?: string;
  itemCount?: number;
}

export default function CartScreenHeading({ restaurantName, itemCount }: CartScreenHeadingProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  const count = itemCount ? t(itemCount === 1 ? 'itemsOne' : 'itemsOther', { count: itemCount }) : null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {t('yourCart')}
      </Text>
      {restaurantName || count ? (
        <View style={styles.metaRow}>
          <Ionicons name="storefront-outline" size={16} color={c.muted} />
          <Text style={styles.meta} numberOfLines={1}>
            {[count, restaurantName && t('cartFrom', { restaurant: restaurantName })].filter(Boolean).join(' ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 20,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    meta: {
      flexShrink: 1,
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
