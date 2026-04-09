import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisineTypes: string[];
  image: string[];
  averageRating: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  isPremium: boolean;
  minimumOrder: number;
  isOpen?: boolean;
  onPress: (id: string) => void;
}

export default function RestaurantCard({
  id,
  name,
  cuisineTypes,
  image,
  averageRating,
  deliveryFee,
  estimatedDeliveryTime,
  isPremium,
  minimumOrder,
  isOpen = true,
  onPress,
}: RestaurantCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleRef, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleRef, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const imageUri =
    image?.[0] ??
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format';

  const feeLabel = deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee}`;

  return (
    <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
      <Pressable
        onPress={() => onPress(id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
          </View>

          {!isOpen && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.minOrder}>
              <Text style={styles.primaryText}>Rs. {minimumOrder}</Text>
              <Text style={styles.mutedSm}> • Avg</Text>
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={c.muted} />
              <Text style={styles.metaText}>{estimatedDeliveryTime} min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="moped-outline"
                size={14}
                color={c.muted}
              />
              <Text style={styles.metaText}>{feeLabel}</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {cuisineTypes.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
            {isPremium && (
              <View style={[styles.tag, styles.premiumTag]}>
                <Text style={[styles.tagText, styles.premiumTagText]}>
                  PREMIUM
                </Text>
              </View>
            )}
            {deliveryFee === 0 && (
              <View style={[styles.tag, styles.freeTag]}>
                <Text style={[styles.tagText, styles.freeTagText]}>
                  FREE DELIVERY
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: c.customerSurface,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.isDark ? 0.4 : 0.09,
      shadowRadius: 12,
      elevation: 5,
      alignSelf: 'center',
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.customerBorder,
    },
    imageWrapper: {
      width: '100%',
      height: 190,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    ratingBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 4,
      gap: 4,
    },
    ratingText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: Fonts.brandBold,
    },
    closedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closedText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: Fonts.brandBold,
    },
    body: {
      padding: 14,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    name: {
      fontSize: 16,
      fontFamily: Fonts.brandBold,
      color: c.customerTextPrimary,
      flex: 1,
      marginRight: 8,
    },
    minOrder: {
      fontSize: 14,
      fontFamily: Fonts.brandBold,
    },
    primaryText: {
      color: c.primary,
      fontFamily: Fonts.brandBold,
      fontSize: 14,
    },
    mutedSm: {
      color: c.muted,
      fontSize: 13,
      fontFamily: Fonts.brand,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 6,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.muted,
    },
    metaText: {
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.muted,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      backgroundColor: c.isDark ? c.card : '#F1F5F9',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tagText: {
      fontSize: 10,
      fontFamily: Fonts.brandBold,
      color: c.customerTextSecondary,
      letterSpacing: 0.4,
    },
    premiumTag: {
      backgroundColor: '#FEF3C7',
    },
    premiumTagText: {
      color: '#B45309',
    },
    freeTag: {
      backgroundColor: '#DCFCE7',
    },
    freeTagText: {
      color: '#166534',
    },
  });
}
