import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurantStore, OrderItem } from '@/stores/restaurantStore';
import { Colors, Fonts } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import { formatRestaurantCurrency, getOrderTimeAgo } from '@/components/pages/restaurant/restaurant-shared/orderUtils';
import {
  RestaurantDashboardHeader,
  KitchenOverviewHero,
  DashboardRevenueCard,
  DashboardStatBox,
  DashboardQuickActions,
  DashboardRecentOrderCard,
  DashboardRecentOrdersEmpty,
} from '@/components/pages/restaurant/restaurant-dashboard';

export default function RestaurantDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dashboard, dashboardLoading, fetchDashboard, toggleActive } = useRestaurantStore();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
      <RestaurantDashboardHeader isActive={isActive} onToggleActive={(val) => toggleActive(val)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dashboardLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <KitchenOverviewHero />

        <DashboardRevenueCard
          totalRevenue={today?.totalRevenue ?? 0}
          totalOrders={today?.totalOrders ?? 0}
          formatCurrency={formatRestaurantCurrency}
        />

        <View style={styles.statsGrid}>
          <DashboardStatBox
            label="ACTIVE ORDERS"
            value={String(
              (today?.pendingCount ?? 0) + (today?.preparingCount ?? 0) + (today?.readyCount ?? 0)
            )}
            icon="receipt-outline"
            sublabel={`${today?.preparingCount ?? 0} preparing`}
          />
          <DashboardStatBox
            label="READY FOR PICKUP"
            value={String(today?.readyCount ?? 0)}
            icon="bag-check-outline"
            sublabel="Awaiting pickup"
          />
        </View>

        <View style={styles.statsGrid}>
          <DashboardStatBox
            label="RATING"
            value={String(restaurant?.averageRating?.toFixed(1) ?? '0.0')}
            icon="star"
            sublabel={`${restaurant?.totalReviews ?? 0} reviews`}
            iconColor="#F59E0B"
          />
          <DashboardStatBox
            label="PENDING"
            value={String(today?.pendingCount ?? 0)}
            icon="time-outline"
            sublabel="Need attention"
            iconColor={Colors.primary}
          />
        </View>

        <DashboardQuickActions
          onViewOrders={() => router.push('/(restaurant)/(tabs)/orders')}
          onManageMenu={() => router.push('/(restaurant)/(tabs)/menu')}
        />

        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
          dashboard.recentOrders.map((order: OrderItem) => (
            <DashboardRecentOrderCard
              key={order._id}
              order={order}
              formatCurrency={formatRestaurantCurrency}
              timeAgo={getOrderTimeAgo(order.createdAt)}
              onPress={() => router.push('/(restaurant)/(tabs)/orders')}
            />
          ))
        ) : (
          <DashboardRecentOrdersEmpty />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    marginBottom: 12,
  },
});
