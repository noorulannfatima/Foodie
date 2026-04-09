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

interface RestaurantListCardProps {
    id: string;
    name: string;
    cuisineTypes: string[];
    image: string[];
    averageRating: number;
    deliveryFee: number;
    estimatedDeliveryTime: number;
    isPremium: boolean;
    isOpen?: boolean;
    onPress: (id: string) => void;
}

export default function RestaurantListCard({
    id,
    name,
    cuisineTypes,
    image,
    averageRating,
    deliveryFee,
    estimatedDeliveryTime,
    isPremium,
    isOpen = true,
    onPress,
}: RestaurantListCardProps) {
    const c = useAppThemeColors();
    const styles = useMemo(() => createStyles(c), [c]);
    const scaleRef = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleRef, {
            toValue: 0.97,
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
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format';

    return (
        <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
            <Pressable
                onPress={() => onPress(id)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.card}
            >
                <View style={styles.thumbWrapper}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.thumb}
                        resizeMode="cover"
                    />
                    {!isOpen && (
                        <View style={styles.closedBadge}>
                            <Text style={styles.closedBadgeText}>Closed</Text>
                        </View>
                    )}
                </View>

                <View style={styles.info}>
                    <View style={styles.topRow}>
                        <Text style={styles.name} numberOfLines={1}>
                            {name}
                        </Text>
                        {isPremium && (
                            <View style={styles.premiumBadge}>
                                <Text style={styles.premiumText}>PREMIUM</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.cuisine} numberOfLines={1}>
                        {cuisineTypes.join(' • ')}
                    </Text>

                    <View style={styles.metaRow}>
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
                        <View style={styles.dot} />
                        <Ionicons name="time-outline" size={12} color={c.muted} />
                        <Text style={styles.metaText}>{estimatedDeliveryTime} min</Text>
                        <View style={styles.dot} />
                        <MaterialCommunityIcons
                            name="moped-outline"
                            size={13}
                            color={deliveryFee === 0 ? '#16A34A' : c.muted}
                        />
                        <Text
                            style={[
                                styles.metaText,
                                deliveryFee === 0 && styles.freeText,
                            ]}
                        >
                            {deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee}`}
                        </Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color={c.customerTextMuted} />
            </Pressable>
        </Animated.View>
    );
}

function createStyles(c: AppColors) {
    return StyleSheet.create({
        card: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.customerSurface,
            borderRadius: 16,
            padding: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: c.isDark ? 0.35 : 0.06,
            shadowRadius: 8,
            elevation: 3,
            marginHorizontal: 16,
            borderWidth: c.isDark ? 1 : 0,
            borderColor: c.customerBorder,
        },
        thumbWrapper: {
            width: 72,
            height: 72,
            borderRadius: 14,
            overflow: 'hidden',
            marginRight: 12,
            position: 'relative',
        },
        thumb: {
            width: '100%',
            height: '100%',
        },
        closedBadge: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        closedBadgeText: {
            color: '#fff',
            fontSize: 10,
            fontFamily: Fonts.brandBold,
        },
        info: {
            flex: 1,
            gap: 3,
        },
        topRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        name: {
            fontSize: 14,
            fontFamily: Fonts.brandBold,
            color: c.customerTextPrimary,
            flex: 1,
        },
        premiumBadge: {
            backgroundColor: '#FEF3C7',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        premiumText: {
            fontSize: 9,
            fontFamily: Fonts.brandBold,
            color: '#B45309',
            letterSpacing: 0.3,
        },
        cuisine: {
            fontSize: 12,
            fontFamily: Fonts.brand,
            color: c.muted,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 2,
        },
        rating: {
            fontSize: 12,
            fontFamily: Fonts.brandBold,
            color: c.customerTextPrimary,
        },
        dot: {
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: c.customerBorder,
        },
        metaText: {
            fontSize: 11,
            fontFamily: Fonts.brand,
            color: c.muted,
        },
        freeText: {
            color: '#16A34A',
            fontFamily: Fonts.brandBold,
        },
    });
}
