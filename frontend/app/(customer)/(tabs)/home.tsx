import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { customerAPI } from '@/services/api/customer.api';
import CategoryPill from '@/components/molecules/CategoryPill/CategoryPill';
import RestaurantCard from '@/components/molecules/RestaurantCard/RestaurantCard';
import RestaurantListCard from '@/components/molecules/RestaurantListCard/RestaurantListCard';
import {
  NAV_COLOR,
  BODY_BG,
  CUISINE_EMOJI,
  CustomerHomeHeader,
  CustomerHomeHero,
  CustomerHomeSearchTrigger,
  HomeSectionHeader,
  HomeFeaturedSkeleton,
  HomePopularEmpty,
  type HomeCategory,
  type HomeRestaurant,
} from '@/components/pages/customer/home';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popularRestaurants, setPopularRestaurants] = useState<HomeRestaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<HomeRestaurant[]>([]);
  const [categories, setCategories] = useState<HomeCategory[]>([]);

  const userName = user?.name?.split(' ')[0] ?? 'Foodie';

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
  }, [fetchHomeData]);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />
      <CustomerHomeHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <CustomerHomeHero userName={userName} />
        <CustomerHomeSearchTrigger onPress={handleSearchPress} />

        <HomeSectionHeader title="Categories" showViewAll />
        <FlatList
          data={categoryData}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <CategoryPill
              id={item.id}
              label={item.label}
              emoji={item.emoji}
              isActive={activeCategoryId === item.id}
              onPress={handleCategoryPress}
            />
          )}
        />

        <HomeSectionHeader title="Popular Near You" marginTop={10} />

        {isLoading ? (
          <HomeFeaturedSkeleton />
        ) : filteredPopular.length === 0 ? (
          <HomePopularEmpty />
        ) : (
          <View style={styles.featuredList}>
            {filteredPopular.map((restaurant) => (
              <RestaurantCard
                key={restaurant._id}
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
          title="All Restaurants"
          marginTop={4}
          rightLabel={`${filteredAll.length} places`}
        />

        {!isLoading && (
          <View style={styles.allRestaurantsSection}>
            {filteredAll.map((restaurant) => (
              <RestaurantListCard
                key={restaurant._id}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAV_COLOR,
  },
  scroll: {
    flex: 1,
    backgroundColor: BODY_BG,
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
});
