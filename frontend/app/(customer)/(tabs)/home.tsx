import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { customerAPI } from '@/services/api/customer.api';
import { useAppThemeColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import CategoryPill from '@/components/molecules/CategoryPill/CategoryPill';
import RestaurantCard from '@/components/molecules/RestaurantCard/RestaurantCard';
import RestaurantListCard from '@/components/molecules/RestaurantListCard/RestaurantListCard';
import { useActiveOrders } from '@/hooks/useActiveOrders';
import { useDismissedOrderCardsStore } from '@/stores/dismissedOrderCardsStore';
import { isFinishedStatus } from '@/components/pages/customer/shared/orderPhases';
import {
  CUISINE_EMOJI,
  CustomerHomeHeader,
  CustomerHomeHero,
  CustomerHomeSearchTrigger,
  HomeSectionHeader,
  HomeFeaturedSkeleton,
  HomePopularEmpty,
  HomeOrderStatusCard,
  type HomeCategory,
  type HomeRestaurant,
} from '@/components/pages/customer/home';

export default function CustomerHome() {
  const themeColors = useAppThemeColors();
  const t = useCustomerT();
  const cardLabels = useMemo(
    () => ({ free: t('free'), closed: t('closed'), premium: t('premiumBadge') }),
    [t],
  );
  const { user } = useAuthStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popularRestaurants, setPopularRestaurants] = useState<HomeRestaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<HomeRestaurant[]>([]);
  const [categories, setCategories] = useState<HomeCategory[]>([]);

  const { orders: activeOrders, refresh: refreshActiveOrders } = useActiveOrders();
  const dismissedIds = useDismissedOrderCardsStore((s) => s.dismissedIds);
  const dismissOrderCard = useDismissedOrderCardsStore((s) => s.dismiss);

  const userName = user?.name?.split(' ')[0] ?? 'Foodie';

  // Finished orders the customer closed stay hidden; in-progress ones can't be dismissed
  const visibleOrders = useMemo(
    () =>
      activeOrders.filter((o) => !(isFinishedStatus(o.status) && dismissedIds.includes(o._id))),
    [activeOrders, dismissedIds],
  );

  const fetchHomeData = useCallback(async () => {
    try {
      const data = await customerAPI.getHome();
      setPopularRestaurants(data.popularRestaurants || []);
      setAllRestaurants(data.allRestaurants || []);

      const cats: HomeCategory[] = [{ id: 'all', label: 'All', emoji: '🍽️', key: 'all' }];
      (data.categories || []).forEach((c: string) => {
        cats.push({
          id: c.toLowerCase().replace(/\s+/g, '-'),
          label: c,
          emoji: CUISINE_EMOJI[c] || '🍴',
          key: c,
        });
      });
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
    refreshActiveOrders();
  }, [fetchHomeData, refreshActiveOrders]);

  const handleOrderPress = useCallback((orderId: string) => {
    router.push(`/(customer)/order/${orderId}`);
  }, []);

  const handleMoreOrdersPress = useCallback(() => {
    router.push('/(customer)/orders');
  }, []);

  const handleRestaurantPress = useCallback((id: string) => {
    router.push(`/(customer)/restaurant/${id}`);
  }, []);

  const handleCategoryPress = useCallback((id: string) => {
    setActiveCategoryId(id);
  }, []);

  const handleSearchPress = useCallback(() => {
    router.push('/(customer)/(tabs)/search');
  }, []);

  const filteredPopular =
    activeCategoryId === 'all'
      ? popularRestaurants
      : popularRestaurants.filter((r) =>
          r.cuisineTypes.some((c) => c.toLowerCase().replace(/\s+/g, '-') === activeCategoryId)
        );

  const filteredAll =
    activeCategoryId === 'all'
      ? allRestaurants
      : allRestaurants.filter((r) =>
          r.cuisineTypes.some((c) => c.toLowerCase().replace(/\s+/g, '-') === activeCategoryId)
        );

  const categoryData =
    categories.length > 0 ? categories : [{ id: 'all', label: 'All', emoji: '🍽️', key: 'all' }];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: themeColors.customerSurface,
        },
        scroll: {
          flex: 1,
          backgroundColor: themeColors.customerBodyBg,
        },
        scrollContent: {
          paddingBottom: 16,
        },
        categoriesList: {
          paddingHorizontal: 16,
          paddingBottom: 4,
          marginBottom: 12,
        },
        featuredList: {
          paddingHorizontal: 16,
        },
        allRestaurantsSection: {
          paddingTop: 4,
        },
        bottomSpacer: {
          height: 24,
        },
      }),
    [themeColors.customerSurface, themeColors.customerBodyBg],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomerHomeHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {visibleOrders.length > 0 ? (
          <HomeOrderStatusCard
            order={visibleOrders[0]}
            moreCount={visibleOrders.length - 1}
            onPress={handleOrderPress}
            onMorePress={handleMoreOrdersPress}
            onDismiss={dismissOrderCard}
          />
        ) : null}
        <CustomerHomeHero userName={userName} />
        <CustomerHomeSearchTrigger onPress={handleSearchPress} />

        <HomeSectionHeader title={t('categories')} showViewAll />
        <FlatList
          data={categoryData}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <CategoryPill
              id={item.id}
              label={item.id === 'all' ? t('categoryAll') : item.label}
              emoji={item.emoji}
              isActive={activeCategoryId === item.id}
              onPress={handleCategoryPress}
            />
          )}
        />

        <HomeSectionHeader title={t('popularNearYou')} marginTop={10} />

        {isLoading ? (
          <HomeFeaturedSkeleton />
        ) : filteredPopular.length === 0 ? (
          <HomePopularEmpty />
        ) : (
          <View style={styles.featuredList}>
            {filteredPopular.map((restaurant) => (
              <RestaurantCard
                key={restaurant._id}
                labels={cardLabels}
                id={restaurant._id}
                name={restaurant.name}
                cuisineTypes={restaurant.cuisineTypes}
                image={restaurant.image}
                averageRating={restaurant.averageRating}
                deliveryFee={restaurant.deliveryFee}
                estimatedDeliveryTime={restaurant.estimatedDeliveryTime}
                isPremium={restaurant.isPremium}
                minimumOrder={restaurant.minimumOrder}
                isOpen={restaurant.isActive && !restaurant.isBusy}
                onPress={handleRestaurantPress}
              />
            ))}
          </View>
        )}

        <HomeSectionHeader
          title={t('allRestaurants')}
          marginTop={4}
          rightLabel={t(filteredAll.length === 1 ? 'placesOne' : 'placesOther', { count: filteredAll.length })}
        />

        {!isLoading && (
          <View style={styles.allRestaurantsSection}>
            {filteredAll.map((restaurant) => (
              <RestaurantListCard
                key={restaurant._id}
                labels={cardLabels}
                id={restaurant._id}
                name={restaurant.name}
                cuisineTypes={restaurant.cuisineTypes}
                image={restaurant.image}
                averageRating={restaurant.averageRating}
                deliveryFee={restaurant.deliveryFee}
                estimatedDeliveryTime={restaurant.estimatedDeliveryTime}
                isPremium={restaurant.isPremium}
                isOpen={restaurant.isActive && !restaurant.isBusy}
                onPress={handleRestaurantPress}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
