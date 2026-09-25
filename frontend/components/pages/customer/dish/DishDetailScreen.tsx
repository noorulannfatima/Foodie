import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, tintBg, type AppColors } from '@/constants/theme';
import type { CustomerStringKey } from '@/constants/customerStrings';
import { STAR_COLOR } from '@/components/atoms/Rating/Rating.styles';
import { Loader } from '@/components/atoms';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import { useCartStore } from '@/stores/cartStore';
import { customerAPI, type MenuItemDetail } from '@/services/api/customer.api';
import { formatCartCurrency } from '@/components/pages/customer/cart/formatCartCurrency';
import DishRatingSummary from './DishRatingSummary';
import DishReviewItem from './DishReviewItem';

const HERO_HEIGHT = 300;
const MAX_QTY = 20;

const SPICE_KEYS: Record<string, CustomerStringKey> = {
  Mild: 'spiceMild',
  Medium: 'spiceMedium',
  Hot: 'spiceHot',
  'Extra Hot': 'spiceExtraHot',
};

/** Dish detail: photos, description, facts, reviews, and an add-to-cart bar. */
export default function DishDetailScreen() {
  const { itemId, restaurantId } = useLocalSearchParams<{ itemId: string; restaurantId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  const [data, setData] = useState<MenuItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [reviewsY, setReviewsY] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await customerAPI.getMenuItemDetail(restaurantId!, itemId!));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, itemId]);

  useEffect(() => {
    if (restaurantId && itemId) load();
  }, [load]);

  const goBack = () => (router.canGoBack() ? router.back() : router.dismissTo('/(customer)/(tabs)/home'));

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <Loader />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { paddingHorizontal: 32 }]}>
        <Ionicons name="fast-food-outline" size={48} color={c.muted} />
        <Text style={styles.centerText}>{failed ? t('loadDishFailed') : t('dishNotFound')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={failed ? load : goBack}>
          <Text style={styles.retryText}>{failed ? t('retry') : t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { item, restaurant, reviews } = data;
  const price = typeof item.discountedPrice === 'number' ? item.discountedPrice : item.price;
  const showOldPrice = price < item.price;
  const restaurantOpen = restaurant.isActive && !restaurant.isBusy;
  const orderable = item.isAvailable && restaurantOpen;
  const ratingTotal = Object.values(reviews.breakdown).reduce((a, b) => a + b, 0);
  const photos = item.image ?? [];

  const facts: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    { icon: 'time-outline', value: t('minutesShort', { count: item.preparationTime }), label: t('dishPrepTime') },
  ];
  if (item.calories) {
    facts.push({ icon: 'flame-outline', value: t('dishCaloriesValue', { count: item.calories }), label: t('dishCalories') });
  }
  if (item.spiceLevel && SPICE_KEYS[item.spiceLevel]) {
    facts.push({ icon: 'thermometer-outline', value: t(SPICE_KEYS[item.spiceLevel]), label: t('dishSpice') });
  }

  const dietTags = [
    item.isVegetarian && t('tagVegetarianFull'),
    item.isVegan && t('tagVeganFull'),
    item.isGlutenFree && t('tagGlutenFreeFull'),
  ].filter(Boolean) as string[];

  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPhoto(Math.round(e.nativeEvent.contentOffset.x / width));

  const handleAdd = async () => {
    setAdding(true);
    try {
      await useCartStore.getState().addToCart({ restaurantId: restaurant._id, menuItem: item._id, quantity: qty });
      goBack();
    } catch (err: unknown) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('addToCartFailed'));
    } finally {
      setAdding(false);
    }
  };

  const bottomBarHeight = 74 + Math.max(insets.bottom, 12);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomBarHeight + 16 }}>
        {/* Photos */}
        <View style={styles.hero}>
          {photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onPhotoScroll}>
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width, height: HERO_HEIGHT }} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroFallback}>
              <Ionicons name="restaurant-outline" size={48} color={c.muted} />
            </View>
          )}
          {photos.length > 1 ? (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>
                {photo + 1} / {photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Details */}
        <View style={styles.sheet}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {`${item.category} · ${restaurant.name}`.toUpperCase()}
          </Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.priceCol}>
              <Text style={styles.price}>{formatCartCurrency(price)}</Text>
              {showOldPrice ? <Text style={styles.oldPrice}>{formatCartCurrency(item.price)}</Text> : null}
            </View>
          </View>

          {item.ratingCount > 0 ? (
            <Pressable
              style={styles.ratingRow}
              onPress={() => scrollRef.current?.scrollTo({ y: reviewsY, animated: true })}
              accessibilityRole="button"
              accessibilityLabel={t(item.ratingCount === 1 ? 'ratingA11yOne' : 'ratingA11yOther', {
                rating: item.averageRating.toFixed(1),
                count: item.ratingCount,
              })}
            >
              <Ionicons name="star" size={16} color={STAR_COLOR} />
              <Text style={styles.ratingValue}>{item.averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>
                {t(item.ratingCount === 1 ? 'ratingsCountOne' : 'ratingsCountOther', { count: item.ratingCount })}
              </Text>
            </Pressable>
          ) : null}

          {dietTags.length > 0 || !item.isAvailable || !restaurantOpen ? (
            <View style={styles.tags}>
              {dietTags.map((tag) => (
                <Text key={tag} style={[styles.tag, styles.tagDiet]}>
                  {tag}
                </Text>
              ))}
              {!orderable ? (
                <Text style={[styles.tag, styles.tagUnavailable]}>
                  {item.isAvailable ? t('restaurantNotTakingOrders') : t('currentlyUnavailable')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

          <View style={styles.facts}>
            {facts.map((f) => (
              <View key={f.label} style={styles.fact}>
                <Ionicons name={f.icon} size={18} color={c.primary} />
                <Text style={styles.factValue}>{f.value}</Text>
                <Text style={styles.factLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.reviews} onLayout={(e) => setReviewsY(e.nativeEvent.layout.y)}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>{t('dishReviews')}</Text>
            {ratingTotal > 0 ? <Text style={styles.reviewsSubtitle}>{t('dishReviewsSubtitle')}</Text> : null}
          </View>

          {ratingTotal === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="star-outline" size={32} color={STAR_COLOR} />
              <Text style={styles.emptyTitle}>{t('noReviewsYet')}</Text>
              <Text style={styles.emptyHint}>{t('noReviewsYetHint')}</Text>
            </View>
          ) : (
            <>
              <DishRatingSummary averageRating={item.averageRating} breakdown={reviews.breakdown} />
              {reviews.latest.length === 0 ? <Text style={styles.emptyHint}>{t('ratingsOnlyHint')}</Text> : null}
              {reviews.latest.map((r) => (
                <DishReviewItem key={r.id} review={r} />
              ))}
              {reviews.writtenCount > reviews.latest.length ? (
                <Pressable
                  style={styles.seeAll}
                  onPress={() =>
                    router.push({
                      pathname: '/(customer)/dish/reviews',
                      params: { restaurantId: restaurant._id, itemId: item._id, name: item.name },
                    })
                  }
                >
                  <Text style={styles.seeAllText}>
                    {t(reviews.writtenCount === 1 ? 'seeAllReviewsOne' : 'seeAllReviewsOther', {
                      count: reviews.writtenCount,
                    })}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={c.primary} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Back */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
      >
        <Ionicons name="chevron-back" size={22} color="#003049" />
      </TouchableOpacity>

      {/* Add to cart */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {orderable ? (
          <>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                accessibilityLabel={t('decreaseQuantity')}
              >
                <Ionicons name="remove" size={20} color={qty <= 1 ? c.muted : c.customerTextPrimary} />
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                disabled={qty >= MAX_QTY}
                accessibilityLabel={t('increaseQuantity')}
              >
                <Ionicons name="add" size={20} color={c.customerTextPrimary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.addBtn, adding && styles.addBtnBusy]} onPress={handleAdd} disabled={adding}>
              {adding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.addText}>{t('addToCart')}</Text>
                  <Text style={styles.addText}>{formatCartCurrency(price * qty)}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.addBtn, styles.addBtnDisabled]}>
            <Text style={styles.disabledText}>
              {item.isAvailable ? t('restaurantNotTakingOrders') : t('currentlyUnavailable')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.customerBodyBg,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: c.customerBodyBg,
    },
    centerText: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.customerTextSecondary,
      textAlign: 'center',
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.brand,
    },
    retryText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
    hero: {
      height: HERO_HEIGHT,
      backgroundColor: c.isDark ? c.card : '#E4E9EF',
    },
    heroFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoCount: {
      position: 'absolute',
      right: 16,
      bottom: 36,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(0,48,73,0.72)',
    },
    photoCountText: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: '#fff',
    },
    backBtn: {
      position: 'absolute',
      left: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.94)',
    },
    sheet: {
      marginTop: -24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: c.customerSurface,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
      gap: 14,
    },
    eyebrow: {
      fontFamily: Fonts.brandBlack,
      fontSize: 12,
      letterSpacing: 0.8,
      color: c.customerTextSecondary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: {
      flex: 1,
      fontFamily: Fonts.brandBlack,
      fontSize: 26,
      lineHeight: 32,
      color: c.customerTextPrimary,
    },
    priceCol: {
      alignItems: 'flex-end',
    },
    price: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.primary,
    },
    oldPrice: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.customerTextSecondary,
      textDecorationLine: 'line-through',
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      minHeight: 32,
    },
    ratingValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 14,
      color: c.customerTextPrimary,
    },
    ratingCount: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.customerTextSecondary,
      textDecorationLine: 'underline',
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      fontFamily: Fonts.brandBlack,
      fontSize: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      overflow: 'hidden',
    },
    tagDiet: {
      color: c.isDark ? '#6EE7B7' : '#1E6B3A',
      backgroundColor: tintBg('#10B981', '#EAF6EE', c.isDark),
    },
    tagUnavailable: {
      color: c.isDark ? '#FCA5A5' : '#8B1A1A',
      backgroundColor: tintBg('#EF4444', '#FDECEC', c.isDark),
    },
    description: {
      fontFamily: Fonts.brand,
      fontSize: 15,
      lineHeight: 23,
      color: c.customerTextSecondary,
    },
    facts: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    fact: {
      flex: 1,
      padding: 12,
      borderRadius: 14,
      gap: 4,
      backgroundColor: c.customerBodyBg,
    },
    factValue: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.customerTextPrimary,
    },
    factLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.customerTextSecondary,
    },
    reviews: {
      marginTop: 10,
      backgroundColor: c.customerSurface,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 24,
      gap: 16,
    },
    reviewsHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    reviewsTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.customerTextPrimary,
    },
    reviewsSubtitle: {
      flexShrink: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.customerTextSecondary,
    },
    emptyReviews: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 26,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: c.customerBodyBg,
    },
    emptyTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.customerTextPrimary,
    },
    emptyHint: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      lineHeight: 20,
      color: c.customerTextSecondary,
      textAlign: 'center',
    },
    seeAll: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.customerBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    seeAllText: {
      fontFamily: Fonts.brandBlack,
      fontSize: 15,
      color: c.primary,
    },
    bar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
      paddingHorizontal: 16,
      backgroundColor: c.customerSurface,
      borderTopWidth: 1,
      borderTopColor: c.customerBorder,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.customerBorder,
    },
    stepBtn: {
      width: 44,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qty: {
      minWidth: 26,
      textAlign: 'center',
      fontFamily: Fonts.brandBlack,
      fontSize: 17,
      color: c.customerTextPrimary,
    },
    addBtn: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      backgroundColor: c.brand,
    },
    addBtnBusy: {
      justifyContent: 'center',
      opacity: 0.8,
    },
    addBtnDisabled: {
      justifyContent: 'center',
      backgroundColor: c.isDark ? c.border : '#D5DDE6',
    },
    addText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
    },
    disabledText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.customerTextSecondary,
    },
  });
}
