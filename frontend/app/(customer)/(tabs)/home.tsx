import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { customerAPI } from '@/services/api/customer.api';
import CategoryPill from '@/components/molecules/CategoryPill/CategoryPill';
import RestaurantCard from '@/components/molecules/RestaurantCard/RestaurantCard';
import RestaurantListCard from '@/components/molecules/RestaurantListCard/RestaurantListCard';
import SkeletonBox from '@/components/atoms/SkeletonBox/SkeletonBox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  emoji: string;
  key: string;
}

interface RestaurantData {
  _id: string;
  name: string;
  cuisineTypes: string[];
  image: string[];
  averageRating: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  isPremium: boolean;
  minimumOrder: number;
  isActive: boolean;
  isBusy?: boolean;
}

// ─── Emoji map for cuisine categories ─────────────────────────────────────────

const CUISINE_EMOJI: Record<string, string> = {
  All: '🍽️',
  Italian: '🍕',
  Japanese: '🍣',
  Sushi: '🍣',
  Burgers: '🍔',
  Gourmet: '🍔',
  Desserts: '🍰',
  Bakery: '🍰',
  Drinks: '🧃',
  Biryani: '🍛',
  Pakistani: '🍛',
  Mexican: '🌮',
  Tacos: '🌮',
  Chinese: '🥡',
  Ramen: '🍜',
  Pizza: '🍕',
  BBQ: '🍖',
  Seafood: '🦐',
  Healthy: '🥗',
  'Fast Food': '🍟',
  Korean: '🍲',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeaturedSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {[1, 2].map((i) => (
        <View key={i} style={skeletonStyles.card}>
          <SkeletonBox width="100%" height={190} borderRadius={0} />
          <View style={skeletonStyles.body}>
            <View style={skeletonStyles.row}>
              <SkeletonBox width={140} height={16} borderRadius={6} />
              <SkeletonBox width={70} height={16} borderRadius={6} />
            </View>
            <SkeletonBox width={110} height={12} borderRadius={6} />
            <View style={skeletonStyles.row}>
              <SkeletonBox width={60} height={24} borderRadius={6} />
              <SkeletonBox width={80} height={24} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  body: { padding: 14, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CustomerHome() {
  const { user } = useAuthStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live data state
  const [popularRestaurants, setPopularRestaurants] = useState<RestaurantData[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<RestaurantData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const userName = user?.name?.split(' ')[0] ?? 'Foodie';

  const fetchHomeData = useCallback(async () => {
    try {
      const data = await customerAPI.getHome();

      setPopularRestaurants(data.popularRestaurants || []);
      setAllRestaurants(data.allRestaurants || []);

      // Build category pills from backend cuisine types
      const cats: Category[] = [
        { id: 'all', label: 'All', emoji: '🍽️', key: 'all' },
      ];
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

  // Filter restaurants by selected category
  const filteredPopular = activeCategoryId === 'all'
    ? popularRestaurants
    : popularRestaurants.filter((r) =>
        r.cuisineTypes.some((c) => c.toLowerCase().replace(/\s+/g, '-') === activeCategoryId)
      );

  const filteredAll = activeCategoryId === 'all'
    ? allRestaurants
    : allRestaurants.filter((r) =>
        r.cuisineTypes.some((c) => c.toLowerCase().replace(/\s+/g, '-') === activeCategoryId)
      );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />

      {/* Top Navigation */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={22} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerLogo}>FOODIE</Text>

        <Pressable
          style={styles.avatarBtn}
          onPress={() => router.push('/(customer)/(tabs)/profile')}
        >
          <Ionicons name="person" size={18} color={NAV_COLOR} />
        </Pressable>
      </View>

      {/* Scrollable Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero / Title Section */}
        <View style={styles.heroSection}>
          <Pressable style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.primary} />
            <Text style={styles.locationLabel}>Deliver to</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              Home – 123 Street Name
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.muted} />
          </Pressable>

          <Text style={styles.greeting}>
            {getGreeting()},{'\n'}
            <Text style={styles.greetingName}>{userName}!</Text>
          </Text>
        </View>

        {/* Search Bar */}
        <Pressable style={styles.searchBar} onPress={handleSearchPress}>
          <Ionicons name="search" size={18} color={Colors.muted} />
          <Text style={styles.searchPlaceholder}>
            Search for sushi, pasta, or burgers…
          </Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </Pressable>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <FlatList
          data={categories.length > 0 ? categories : [
            { id: 'all', label: 'All', emoji: '🍽️', key: 'all' },
          ]}
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

        {/* Popular Near You */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Popular Near You</Text>
        </View>

        {isLoading ? (
          <FeaturedSkeleton />
        ) : filteredPopular.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="restaurant-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No restaurants found</Text>
          </View>
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

        {/* All Restaurants */}
        <View style={[styles.sectionHeader, { marginTop: 4 }]}>
          <Text style={styles.sectionTitle}>All Restaurants</Text>
          <Text style={styles.restaurantCount}>
            {filteredAll.length} places
          </Text>
        </View>

        {isLoading ? null : (
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_COLOR = '#003049';
const BODY_BG = '#EEF4FB';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAV_COLOR,
  },
  header: {
    backgroundColor: NAV_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCBF49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: BODY_BG,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.muted,
  },
  locationValue: {
    fontSize: 12,
    fontFamily: Fonts.brandBold,
    color: Colors.text,
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    fontFamily: Fonts.brand,
    color: Colors.muted,
    lineHeight: 26,
  },
  greetingName: {
    fontSize: 28,
    fontFamily: Fonts.brandBlack,
    color: Colors.text,
    lineHeight: 36,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 22,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.brand,
    color: '#94A3B8',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: Colors.text,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: Fonts.brandBold,
    color: Colors.primary,
  },
  restaurantCount: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.muted,
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
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.brand,
    color: Colors.muted,
  },
});
