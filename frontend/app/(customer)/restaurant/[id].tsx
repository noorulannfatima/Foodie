// app/(customer)/restaurant/[id].tsx
// This screen displays the details of a restaurant and its menu
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { customerAPI } from '@/services/api/customer.api';
import { useCartStore } from '@/stores/cartStore';
import { Loader } from '@/components/atoms';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { formatCurrency } from '@/utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 220;
const TOP_BAR_HEIGHT = 52; // Below the status bar
const CATEGORY_BAR_HEIGHT = 48;
const CART_FOOTER_HEIGHT = 56;

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItemData {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  image: string[];
  category: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel?: string;
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  averageRating: number;
  ratingCount: number;
}

interface MenuCategory {
  _id: string;
  name: string;
  description?: string;
}

interface RestaurantData {
  _id: string;
  name: string;
  description: string;
  cuisineTypes: string[];
  image: string[];
  logo?: string;
  averageRating: number;
  totalReviews: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  isPremium: boolean;
  minimumOrder: number;
  isActive: boolean;
  address: { street: string; city: string };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart, cart, itemCount } = useCartStore();
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createRestaurantDetailStyles(c), [c]);

  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuByCategory, setMenuByCategory] = useState<Record<string, MenuItemData[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Scroll-driven chrome: the compact top bar fades in once the banner is gone,
  // and a pinned copy of the category tabs replaces the inline one below it.
  const scrollRef = useRef<ScrollView>(null);
  const [categoryBarY, setCategoryBarY] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [tabsPinned, setTabsPinned] = useState(false);
  const topBarHeight = insets.top + TOP_BAR_HEIGHT;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setCollapsed(y > BANNER_HEIGHT - topBarHeight);
    setTabsPinned(categoryBarY > 0 && y >= categoryBarY - topBarHeight);
  };

  const selectCategory = (name: string) => {
    setActiveCategory(name);
    // Start the new category at the top instead of mid-list
    if (tabsPinned) scrollRef.current?.scrollTo({ y: categoryBarY - topBarHeight, animated: false });
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getRestaurantDetail(id!);
      setRestaurant(data.restaurant);

      if (data.menu) {
        setCategories(data.menu.categories || []);
        setMenuByCategory(data.menu.menuByCategory || {});
        if (data.menu.categories?.length > 0) {
          setActiveCategory(data.menu.categories[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to load restaurant:', error);
      Alert.alert(t('error'), t('loadRestaurantFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: MenuItemData) => {
    if (!restaurant) return;
    try {
      await addToCart({
        restaurantId: restaurant._id,
        menuItem: item._id,
        name: item.name,
        price: item.discountedPrice || item.price,
        quantity: 1,
      });
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('addToCartFailed'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('restaurantNotFound')}</Text>
      </View>
    );
  }

  const bannerImage = restaurant.image?.[0];
  const cartCount = itemCount();

  const categoryTabs = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryBarContent}
    >
      {categories.map((cat) => {
        const active = activeCategory === cat.name;
        return (
          <TouchableOpacity
            key={cat._id}
            style={[styles.categoryTab, active && styles.categoryTabActive]}
            onPress={() => selectCategory(cat.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={collapsed && !c.isDark ? 'dark-content' : 'light-content'} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: cartCount > 0 ? CART_FOOTER_HEIGHT + Math.max(insets.bottom, 12) + 24 : 32,
        }}
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {bannerImage ? (
            <Image source={{ uri: bannerImage }} style={styles.banner} />
          ) : (
            <View style={[styles.banner, styles.bannerPlaceholder]}>
              <Ionicons name="restaurant" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <View style={styles.bannerOverlay} />

          <View style={styles.bannerInfo}>
            {restaurant.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>{t('premiumDelivery')}</Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{restaurant.averageRating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDesc} numberOfLines={2}>{restaurant.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={c.muted} />
              <Text style={styles.metaText}>{t('minutesShort', { count: restaurant.estimatedDeliveryTime })}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={14} color={c.muted} />
              <Text style={styles.metaText}>
                {restaurant.deliveryFee === 0 ? t('free') : formatCurrency(restaurant.deliveryFee)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="receipt-outline" size={14} color={c.muted} />
              <Text style={styles.metaText}>{t('minOrder', { amount: formatCurrency(restaurant.minimumOrder) })}</Text>
            </View>
          </View>
        </View>

        {/* Category Tabs (inline; a pinned copy takes over once scrolled past) */}
        {categories.length > 0 && (
          <View
            style={[styles.categoryBar, tabsPinned && styles.hidden]}
            onLayout={(e) => setCategoryBarY(e.nativeEvent.layout.y)}
          >
            {categoryTabs}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContent}>
          {categories.map((cat) => {
            if (activeCategory && activeCategory !== cat.name) return null;
            const items = menuByCategory[cat.name] || [];
            if (items.length === 0) return null;

            return (
              <View key={cat._id}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  {cat.description && (
                    <Text style={styles.categorySubtitle}>{cat.description}</Text>
                  )}
                </View>

                {items.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.menuItem}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/(customer)/dish/[itemId]',
                        params: { itemId: item._id, restaurantId: restaurant._id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                  >
                    {item.image?.[0] && (
                      <Image source={{ uri: item.image[0] }} style={styles.menuItemImage} />
                    )}
                    <View style={styles.menuItemBody}>
                      <View style={styles.menuItemRow}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>
                          {formatCurrency(item.discountedPrice || item.price)}
                        </Text>
                      </View>

                      {item.ratingCount > 0 && (
                        <View
                          style={styles.menuItemRating}
                          accessible
                          accessibilityLabel={t(item.ratingCount === 1 ? 'ratingA11yOne' : 'ratingA11yOther', {
                            rating: item.averageRating.toFixed(1),
                            count: item.ratingCount,
                          })}
                        >
                          <Ionicons name="star" size={12} color="#FFA94D" />
                          <Text style={styles.menuItemRatingValue}>{item.averageRating.toFixed(1)}</Text>
                          <Text style={styles.menuItemRatingCount}>({item.ratingCount})</Text>
                        </View>
                      )}

                      <Text style={styles.menuItemDesc} numberOfLines={2}>
                        {item.description}
                      </Text>

                      {/* Tags */}
                      <View style={styles.menuItemTags}>
                        {item.isVegetarian && <Text style={styles.tagBadge}>{t('tagVeg')}</Text>}
                        {item.isVegan && <Text style={styles.tagBadge}>{t('tagVegan')}</Text>}
                        {item.isGlutenFree && <Text style={styles.tagBadge}>{t('tagGlutenFree')}</Text>}
                      </View>

                      <TouchableOpacity
                        style={[styles.addBtn, !item.isAvailable && styles.addBtnDisabled]}
                        onPress={() => item.isAvailable && handleAddToCart(item)}
                        disabled={!item.isAvailable}
                      >
                        <Ionicons name="cart-outline" size={16} color="#fff" />
                        <Text style={styles.addBtnText}>
                          {item.isAvailable ? t('addToCart') : t('unavailable')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}

          {categories.length === 0 && (
            <View style={styles.emptyMenu}>
              <Ionicons name="restaurant-outline" size={48} color={c.muted} />
              <Text style={styles.emptyMenuText}>{t('noMenuItems')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Compact top bar, shown once the banner has scrolled away */}
      {collapsed && (
        <View style={[styles.topBar, { height: topBarHeight, paddingTop: insets.top }]}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>
      )}

      {/* Pinned category tabs */}
      {tabsPinned && (
        <View style={[styles.categoryBar, styles.pinnedCategoryBar, { top: topBarHeight }]}>
          {categoryTabs}
        </View>
      )}

      {/* Back button: floats over the banner, then sits in the top bar */}
      <TouchableOpacity
        style={[styles.backBtn, collapsed && styles.backBtnCollapsed, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
      >
        <Ionicons name="arrow-back" size={22} color={collapsed ? c.text : '#fff'} />
      </TouchableOpacity>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartFooter, { bottom: Math.max(insets.bottom, 12) }]}
          onPress={() => router.push('/(customer)/(tabs)/cart')}
          accessibilityRole="button"
          accessibilityLabel={t(cartCount === 1 ? 'viewCartA11yOne' : 'viewCartA11yOther', { count: cartCount })}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartFooterText}>{t('viewCart')}</Text>
          <Text style={styles.cartFooterPrice}>
            {formatCurrency(useCartStore.getState().total())}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createRestaurantDetailStyles(c: AppColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.customerBodyBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.customerBodyBg,
  },
  errorText: {
    fontFamily: Fonts.brand,
    fontSize: 16,
    color: c.muted,
  },
  bannerContainer: {
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  banner: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    backgroundColor: '#003049',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnCollapsed: {
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 64, // Clear of the back button on both sides
    backgroundColor: c.customerSurface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  topBarTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 17,
    color: c.text,
    textAlign: 'center',
  },
  bannerInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: c.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumText: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: '#fff',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.customerSurface,
  },
  restaurantName: {
    fontFamily: Fonts.brandBlack,
    fontSize: 24,
    color: c.text,
    marginBottom: 6,
  },
  restaurantDesc: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: c.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: c.muted,
  },
  categoryBar: {
    height: CATEGORY_BAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.customerSurface,
  },
  pinnedCategoryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  hidden: {
    opacity: 0,
  },
  categoryBarContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  categoryTab: {
    height: CATEGORY_BAR_HEIGHT - 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: c.primary,
  },
  categoryTabText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    lineHeight: 20,
    color: c.muted,
  },
  categoryTabTextActive: {
    fontFamily: Fonts.brandBold,
    color: c.primary,
  },
  menuContent: {
    padding: 16,
    backgroundColor: c.customerBodyBg,
  },
  categoryHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  categoryTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 22,
    color: c.text,
  },
  categorySubtitle: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: c.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    backgroundColor: c.customerSurface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: c.isDark ? 0.25 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemImage: {
    width: '100%',
    // Same ratio menu photos are cropped to on upload, so nothing is cut off
    aspectRatio: 16 / 9,
    resizeMode: 'cover',
  },
  menuItemBody: {
    padding: 14,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  menuItemName: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: c.text,
    flex: 1,
    marginRight: 8,
  },
  menuItemPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: c.primary,
  },
  menuItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  menuItemRatingValue: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: c.text,
  },
  menuItemRatingCount: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: c.muted,
  },
  menuItemDesc: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: c.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  menuItemTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  tagBadge: {
    fontFamily: Fonts.brandBold,
    fontSize: 9,
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.brand,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  addBtnDisabled: {
    backgroundColor: c.muted,
  },
  addBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyMenuText: {
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: c.muted,
  },
  cartFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: CART_FOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.brand,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  cartBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: '#fff',
  },
  cartFooterText: {
    flex: 1,
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cartFooterPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: '#fff',
  },
  });
}

