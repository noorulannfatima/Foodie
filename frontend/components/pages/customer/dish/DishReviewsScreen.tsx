import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { customerAPI, type DishReview } from '@/services/api/customer.api';
import CustomerScreenHeader from '@/components/pages/customer/CustomerScreenHeader';
import { customerHeaderBg } from '@/components/pages/customer/CustomerHeader';
import DishReviewItem from './DishReviewItem';
import DishStars from './DishStars';

const PAGE_SIZE = 20;
const FILTERS = [0, 5, 4, 3, 2, 1];

/** Every written review of one dish, newest first, filterable by star rating. */
export default function DishReviewsScreen() {
  const { restaurantId, itemId, name } = useLocalSearchParams<{ restaurantId: string; itemId: string; name?: string }>();
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  const [summary, setSummary] = useState<{ average: number; ratings: number } | null>(null);
  const [filter, setFilter] = useState(0);
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  // Ignores pages that arrive after the filter changed.
  const requestId = useRef(0);

  useEffect(() => {
    customerAPI
      .getMenuItemDetail(restaurantId!, itemId!)
      .then(({ item }) => setSummary({ average: item.averageRating, ratings: item.ratingCount }))
      .catch(() => {});
  }, [restaurantId, itemId]);

  const loadPage = useCallback(
    async (next: number, rating: number) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const res = await customerAPI.getMenuItemReviews(restaurantId!, itemId!, {
          rating: rating || undefined,
          page: next,
          limit: PAGE_SIZE,
        });
        if (id !== requestId.current) return;
        setReviews((prev) => (next === 1 ? res.reviews : [...prev, ...res.reviews]));
        setPage(next);
        setPages(res.pagination.pages);
      } catch {
        // Keep what is shown; scrolling again retries.
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [restaurantId, itemId],
  );

  useEffect(() => {
    setReviews([]);
    setPage(0);
    loadPage(1, filter);
  }, [filter, loadPage]);

  const header = (
    <View style={styles.headerBlock}>
      {name ? (
        <Text style={styles.dishName} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
      {summary && summary.ratings > 0 ? (
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{summary.average.toFixed(1)}</Text>
          <View style={styles.summaryText}>
            <DishStars rating={summary.average} />
            <Text style={styles.summaryCount}>
              {t(summary.ratings === 1 ? 'ratingsCountOne' : 'ratingsCountOther', { count: summary.ratings })}
            </Text>
          </View>
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('filterByRatingA11y')}
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={f ? t('starsA11y', { rating: f }) : t('filterAllRatings')}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f ? `${f} ★` : t('filterAllRatings')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: customerHeaderBg(c) }]} edges={['top']}>
      <CustomerScreenHeader title={t('dishReviews')} />
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={reviews}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <DishReviewItem review={item} variant="card" />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? null : <Text style={styles.empty}>{t('noReviewsForRating')}</Text>
        }
        ListFooterComponent={loading ? <ActivityIndicator style={styles.spinner} color={c.primary} /> : null}
        onEndReached={() => {
          if (!loading && page > 0 && page < pages) loadPage(page + 1, filter);
        }}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    list: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 10,
    },
    headerBlock: {
      gap: 12,
      paddingTop: 4,
      marginBottom: 2,
    },
    dishName: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.customerTextPrimary,
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.customerSurface,
    },
    summaryValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 30,
      color: c.customerTextPrimary,
    },
    summaryText: {
      gap: 3,
    },
    summaryCount: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    filters: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: c.customerBorder,
      backgroundColor: c.customerSurface,
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    chipText: {
      fontFamily: Fonts.brandBlack,
      fontSize: 13,
      color: c.customerTextPrimary,
    },
    chipTextActive: {
      color: '#fff',
    },
    empty: {
      paddingVertical: 40,
      paddingHorizontal: 20,
      textAlign: 'center',
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.customerTextSecondary,
    },
    spinner: {
      marginVertical: 16,
    },
  });
}
