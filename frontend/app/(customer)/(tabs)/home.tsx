import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import CategoryPill from '@/components/molecules/CategoryPill/CategoryPill';
import RestaurantCard from '@/components/molecules/RestaurantCard/RestaurantCard';
import RestaurantListCard from '@/components/molecules/RestaurantListCard/RestaurantListCard';
import SkeletonBox from '@/components/atoms/SkeletonBox/SkeletonBox';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  emoji: string;
  key: string;
}

interface MockRestaurant {
  _id: string;
  name: string;
  cuisineTypes: string[];
  image: string[];
  averageRating: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  isPremium: boolean;
  minimumOrder: number;
  isOpen: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static Data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', emoji: '🍽️', key: 'all' },
  { id: 'italian', label: 'Italian', emoji: '🍕', key: 'italian' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣', key: 'sushi' },
  { id: 'burgers', label: 'Burgers', emoji: '🍔', key: 'burgers' },
  { id: 'desserts', label: 'Desserts', emoji: '🍰', key: 'desserts' },
  { id: 'drinks', label: 'Drinks', emoji: '🧃', key: 'drinks' },
  { id: 'biryani', label: 'Biryani', emoji: '🍛', key: 'biryani' },
];

const POPULAR_RESTAURANTS: MockRestaurant[] = [
  {
    _id: 'r1',
    name: 'Umami Zen Sushi',
    cuisineTypes: ['Japanese', 'Sushi'],
    image: ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop'],
    averageRating: 4.9,
    deliveryFee: 0,
    estimatedDeliveryTime: 25,
    isPremium: true,
    minimumOrder: 500,
    isOpen: true,
  },
  {
    _id: 'r2',
    name: 'Napoli Hearth',
    cuisineTypes: ['Italian', 'Family'],
    image: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop'],
    averageRating: 4.7,
    deliveryFee: 2.99,
    estimatedDeliveryTime: 40,
    isPremium: false,
    minimumOrder: 300,
    isOpen: true,
  },
  {
    _id: 'r3',
    name: 'The Burger Collective',
    cuisineTypes: ['Gourmet', 'Burgers'],
    image: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop'],
    averageRating: 4.8,
    deliveryFee: 0,
    estimatedDeliveryTime: 20,
    isPremium: false,
    minimumOrder: 250,
    isOpen: true,
  },
  {
    _id: 'r4',
    name: 'Lahori Darbar',
    cuisineTypes: ['Pakistani', 'Biryani'],
    image: ['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop'],
    averageRating: 4.6,
    deliveryFee: 50,
    estimatedDeliveryTime: 35,
    isPremium: true,
    minimumOrder: 400,
    isOpen: false,
  },
];

const ALL_RESTAURANTS: MockRestaurant[] = [
  {
    _id: 'a1',
    name: 'Desi Tadka',
    cuisineTypes: ['Pakistani', 'Karahi'],
    image: ['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&auto=format&fit=crop'],
    averageRating: 4.4,
    deliveryFee: 0,
    estimatedDeliveryTime: 30,
    isPremium: false,
    minimumOrder: 200,
    isOpen: true,
  },
  {
    _id: 'a2',
    name: 'Sakura Garden',
    cuisineTypes: ['Japanese', 'Ramen'],
    image: ['https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&auto=format&fit=crop'],
    averageRating: 4.5,
    deliveryFee: 1.99,
    estimatedDeliveryTime: 28,
    isPremium: true,
    minimumOrder: 350,
    isOpen: true,
  },
  {
    _id: 'a3',
    name: 'Casa Mexicana',
    cuisineTypes: ['Mexican', 'Tacos'],
    image: ['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop'],
    averageRating: 4.3,
    deliveryFee: 0,
    estimatedDeliveryTime: 22,
    isPremium: false,
    minimumOrder: 280,
    isOpen: true,
  },
  {
    _id: 'a4',
    name: 'The Sweet Spot',
    cuisineTypes: ['Desserts', 'Bakery'],
    image: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&auto=format&fit=crop'],
    averageRating: 4.7,
    deliveryFee: 0,
    estimatedDeliveryTime: 18,
    isPremium: false,
    minimumOrder: 150,
    isOpen: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loaders
// ─────────────────────────────────────────────────────────────────────────────

function FeaturedSkeleton() {
  const { width } = Dimensions.get('window');
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerHome() {
  const { user } = useAuthStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [isLoading] = useState<boolean>(false); // Set true while fetching

  const userName = user?.name?.split(' ')[0] ?? 'Foodie';

  const handleRestaurantPress = useCallback((id: string) => {
    router.push(`/(customer)/restaurant/${id}`);
  }, []);

  const handleCategoryPress = useCallback((id: string) => {
    setActiveCategoryId(id);
  }, []);

  const handleSearchPress = useCallback(() => {
    router.push('/(customer)/(tabs)/search');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={NAV_COLOR} />

      {/* ── Top Navigation ── */}
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

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero / Title Section ── */}
        <View style={styles.heroSection}>
          {/* Deliver To Row */}
          <Pressable style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.primary} />
            <Text style={styles.locationLabel}>Deliver to</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              Home – 123 Street Name
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.muted} />
          </Pressable>

          {/* Greeting */}
          <Text style={styles.greeting}>
            {getGreeting()},{'\n'}
            <Text style={styles.greetingName}>{userName}! 👋</Text>
          </Text>
        </View>

        {/* ── Search Bar ── */}
        <Pressable style={styles.searchBar} onPress={handleSearchPress}>
          <Ionicons name="search" size={18} color={Colors.muted} />
          <Text style={styles.searchPlaceholder}>
            Search for sushi, pasta, or burgers…
          </Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </Pressable>

        {/* ── Categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        <FlatList
          data={CATEGORIES}
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

        {/* ── Popular Near You ── */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Popular Near You</Text>
        </View>

        {isLoading ? (
          <FeaturedSkeleton />
        ) : (
          <View style={styles.featuredList}>
            {POPULAR_RESTAURANTS.map((restaurant) => (
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
                isOpen={restaurant.isOpen}
                onPress={handleRestaurantPress}
              />
            ))}
          </View>
        )}

        {/* ── All Restaurants ── */}
        <View style={[styles.sectionHeader, { marginTop: 4 }]}>
          <Text style={styles.sectionTitle}>All Restaurants</Text>
          <Text style={styles.restaurantCount}>
            {ALL_RESTAURANTS.length} places
          </Text>
        </View>

        <View style={styles.allRestaurantsSection}>
          {ALL_RESTAURANTS.map((restaurant) => (
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
              isOpen={restaurant.isOpen}
              onPress={handleRestaurantPress}
            />
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NAV_COLOR = '#003049';
const BODY_BG = '#EEF4FB';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAV_COLOR,
  },

  // ── Header ──────────────────────────────────────────────────────────────
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

  // ── Scroll ──────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: BODY_BG,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // ── Hero Section ────────────────────────────────────────────────────────
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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

  // ── Search Bar ──────────────────────────────────────────────────────────
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

  // ── Section Headers ──────────────────────────────────────────────────────
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

  // ── Categories ───────────────────────────────────────────────────────────
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 12,
  },

  // ── Featured List ─────────────────────────────────────────────────────────
  featuredList: {
    paddingHorizontal: 16,
  },

  // ── All Restaurants ───────────────────────────────────────────────────────
  allRestaurantsSection: {
    paddingTop: 4,
  },
});