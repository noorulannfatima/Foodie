import { useMemo } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import type { CartSuggestions } from '@/services/api/customer.api';
import { formatCartCurrency } from './formatCartCurrency';

type PopularItem = CartSuggestions['popularItems'][number];

export interface CartPopularItemsProps {
  items: PopularItem[];
  onItemPress: (item: PopularItem) => void;
}

/** Horizontal rail of the dishes other customers order most. */
export default function CartPopularItems({ items, onItemPress }: CartPopularItemsProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {items.map((item) => (
        <Pressable
          key={item.menuItem}
          style={styles.card}
          onPress={() => onItemPress(item)}
          accessibilityLabel={t('popularItemA11y', {
              name: item.name,
              restaurant: item.restaurant.name,
              price: formatCartCurrency(item.price),
            })}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="fast-food-outline" size={28} color={c.customerTextMuted} />
            </View>
          )}
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.restaurant} numberOfLines={1}>
              {item.restaurant.name}
            </Text>
            <View style={styles.bottomRow}>
              <Text style={styles.price}>{formatCartCurrency(item.price)}</Text>
              <Text style={styles.count}>
                {t(item.orderCount === 1 ? 'ordersCountOne' : 'ordersCountOther', { count: item.orderCount })}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    rail: {
      paddingHorizontal: 16,
      gap: 12,
    },
    card: {
      width: 156,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: c.customerSurface,
      borderWidth: 1,
      borderColor: c.customerBorder,
    },
    image: {
      width: '100%',
      height: 104,
      backgroundColor: c.customerBodyBg,
    },
    imageFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: 10,
      gap: 2,
    },
    name: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.customerTextPrimary,
    },
    restaurant: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    price: {
      fontFamily: Fonts.brandBlack,
      fontSize: 13,
      color: c.primary,
    },
    count: {
      fontFamily: Fonts.brand,
      fontSize: 11,
      color: c.customerTextMuted,
    },
  });
}
