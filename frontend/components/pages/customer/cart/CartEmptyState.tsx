import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import SkeletonBox from '@/components/atoms/SkeletonBox/SkeletonBox';
import type { CartSuggestions } from '@/services/api/customer.api';
import CartLastOrderCard from './CartLastOrderCard';
import CartPopularItems from './CartPopularItems';

export interface CartEmptyStateProps {
  onBrowseRestaurants: () => void;
  /** null until the first load finishes (or if it failed). */
  suggestions: CartSuggestions | null;
  suggestionsLoading: boolean;
  reordering: boolean;
  onReorder: (orderId: string) => void;
  onOpenOrder: (orderId: string) => void;
  onPopularItemPress: (item: CartSuggestions['popularItems'][number]) => void;
}

export default function CartEmptyState({
  onBrowseRestaurants,
  suggestions,
  suggestionsLoading,
  reordering,
  onReorder,
  onOpenOrder,
  onPopularItemPress,
}: CartEmptyStateProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  const lastOrder = suggestions?.lastOrder ?? null;
  const popularItems = suggestions?.popularItems ?? [];
  const showSkeleton = suggestionsLoading && !suggestions;
  // With nothing to suggest, keep the original centred empty state.
  const hasSuggestions = showSkeleton || !!lastOrder || popularItems.length > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, !hasSuggestions && styles.contentCentered]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, hasSuggestions && styles.heroCompact]}>
        <Ionicons name="bag-outline" size={hasSuggestions ? 48 : 64} color={c.muted} />
        <Text style={styles.emptyTitle}>{t('cartEmpty')}</Text>
        <Text style={styles.emptySubtext}>{t('cartEmptyHint')}</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={onBrowseRestaurants}>
          <Text style={styles.browseBtnText}>{t('browseRestaurants')}</Text>
        </TouchableOpacity>
      </View>

      {showSkeleton && (
        <View style={[styles.section, styles.skeleton]}>
          <SkeletonBox width={140} height={18} />
          <SkeletonBox width="100%" height={150} borderRadius={14} />
        </View>
      )}

      {lastOrder && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('yourLastOrder')}</Text>
          <CartLastOrderCard
            order={lastOrder}
            reordering={reordering}
            onReorder={() => onReorder(lastOrder._id)}
            onOpen={() => onOpenOrder(lastOrder._id)}
          />
        </View>
      )}

      {popularItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('popularRightNow')}</Text>
          <Text style={styles.sectionSubtitle}>{t('popularRightNowHint')}</Text>
          <CartPopularItems items={popularItems} onItemPress={onPopularItemPress} />
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    contentCentered: {
      justifyContent: 'center',
    },
    hero: {
      alignItems: 'center',
      gap: 12,
      padding: 20,
    },
    heroCompact: {
      paddingTop: 28,
      paddingBottom: 8,
    },
    emptyTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 22,
      color: c.text,
    },
    emptySubtext: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
    browseBtn: {
      backgroundColor: c.brand,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
      marginTop: 8,
    },
    browseBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.customerTextPrimary,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.customerTextSecondary,
      paddingHorizontal: 16,
      marginTop: -8,
      marginBottom: 12,
    },
    skeleton: {
      paddingHorizontal: 16,
      gap: 12,
    },
  });
}
