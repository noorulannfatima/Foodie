import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurantStore, OrderItem } from '@/stores/restaurantStore';
import { useAppThemeColors, Fonts } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { formatRestaurantCurrency, getOrderTimeAgo } from '@/components/pages/restaurant/shared/orderUtils';
import {
  KitchenOverviewHero,
  DashboardRevenueCard,
  DashboardRecentOrderCard,
  DashboardRecentOrdersEmpty,
} from '@/components/pages/restaurant/dashboard';
import { RecentReviewsSection, type RecentReview } from '@/components/pages/reviews';
import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';
import { useRestaurantT } from '@/constants/restaurantStrings';
import { restaurantAPI } from '@/services/api/restaurant.api';

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const Colors = useAppThemeColors();
  const t = useRestaurantT();
  const { dashboard, dashboardLoading, fetchDashboard, toggleActive } = useRestaurantStore();
  const [recentReviews, setRecentReviews] = useState<RecentReview[] | null>(null);

  const reviewPalette = useMemo<ReviewPalette>(
    () => ({
      card: Colors.card,
      text: Colors.text,
      muted: Colors.muted,
      border: Colors.border,
      accent: Colors.primary,
    }),
    [Colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: Colors.screenBackground,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.screenBackground,
        },
        scrollContent: {
          padding: 20,
          paddingBottom: 40,
        },
        sectionTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 20,
          color: Colors.text,
          marginBottom: 12,
        },
      }),
    [Colors],
  );

  const fetchRecentReviews = useCallback(async () => {
    try {
      const res = await restaurantAPI.getReviews(1, 3);
      setRecentReviews(res.reviews.map((r) => ({ ...r, title: r.dishName })));
    } catch {
      // The section stays hidden; the rest of the dashboard still works
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboard();
    fetchRecentReviews();
  }, [fetchDashboard, fetchRecentReviews]);

  const pullRefresh = useCallback(
    () => Promise.all([fetchDashboard(), fetchRecentReviews()]),
    [fetchDashboard, fetchRecentReviews],
  );
  const { refreshing, onRefresh: onPullRefresh } = usePullToRefresh(pullRefresh);

  // Refetch whenever the tab regains focus, so new orders and reviews show up
  useFocusEffect(onRefresh);

  if (dashboardLoading && !dashboard) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  const today = dashboard?.today;
  const restaurant = dashboard?.restaurant;
  const isActive = restaurant?.isActive ?? false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            tintColor={Colors.primary}
            colors={[Colors.brand]}
          />}
        contentContainerStyle={styles.scrollContent}
      >
        <KitchenOverviewHero
          restaurantName={restaurant?.name}
          isActive={isActive}
          onToggleActive={(val) => toggleActive(val)}
        />

        <DashboardRevenueCard
          totalRevenue={today?.totalRevenue ?? 0}
          totalOrders={today?.totalOrders ?? 0}
          formatCurrency={formatRestaurantCurrency}
        />

        <Text style={styles.sectionTitle}>{t('dashRecentOrders')}</Text>
        {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
          dashboard.recentOrders.map((order: OrderItem) => (
            <DashboardRecentOrderCard
              key={order._id}
              order={order}
              formatCurrency={formatRestaurantCurrency}
              timeAgo={getOrderTimeAgo(order.createdAt, t)}
              onPress={() => router.push('/(restaurant)/(tabs)/orders')}
            />
          ))
        ) : (
          <DashboardRecentOrdersEmpty />
        )}

        <RecentReviewsSection
          reviews={recentReviews}
          onSeeAll={() => router.push('/(restaurant)/reviews')}
          palette={reviewPalette}
          titleStyle={styles.sectionTitle}
        />
      </ScrollView>
    </View>
  );
}
