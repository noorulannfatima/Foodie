import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppThemeColors, Fonts } from '@/constants/theme';
import type { RestaurantProfile } from '@/stores/restaurantStore';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';
import { getDisplayOperatingHours } from './getDisplayOperatingHours';

export interface GeneralTabProps {
  profile: RestaurantProfile;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenHoursModal: () => void;
}

export default function GeneralTab({
  profile,
  refreshing,
  onRefresh,
  onOpenHoursModal,
}: GeneralTabProps) {
  const { screenStyles } = useRestaurantProfileStyles();
  const c = useAppThemeColors();
  const groups = getDisplayOperatingHours(profile);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: c.card,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c.border,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        },
        cardTitle: {
          fontFamily: Fonts.brandBold,
          fontSize: 12,
          color: c.muted,
          letterSpacing: 1,
        },
        hoursRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        },
        hoursDay: {
          fontFamily: Fonts.brand,
          fontSize: 14,
          color: c.text,
        },
        hoursTime: {
          fontFamily: Fonts.brandBold,
          fontSize: 14,
          color: c.text,
        },
        updateHoursBtn: {
          alignSelf: 'center',
          marginTop: 12,
          paddingHorizontal: 20,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: c.border,
        },
        updateHoursBtnText: {
          fontFamily: Fonts.brandBold,
          fontSize: 13,
          color: c.text,
        },
        performanceCard: {
          backgroundColor: c.secondary,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        },
        perfHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        perfTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 20,
          color: '#fff',
        },
        perfStats: {
          flexDirection: 'row',
          gap: 24,
          marginBottom: 16,
        },
        perfStat: {},
        perfStatLabel: {
          fontFamily: Fonts.brandBold,
          fontSize: 10,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        perfStatValue: {
          fontFamily: Fonts.brandBlack,
          fontSize: 28,
          color: '#fff',
        },
        perfStatMax: {
          fontFamily: Fonts.brand,
          fontSize: 16,
          color: 'rgba(255,255,255,0.6)',
        },
        perfBadges: {
          flexDirection: 'row',
          gap: 8,
        },
        perfBadge: {
          backgroundColor: 'rgba(255,255,255,0.15)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        },
        perfBadgeText: {
          fontFamily: Fonts.brandBold,
          fontSize: 11,
          color: '#fff',
        },
      }),
    [c],
  );

  return (
    <ScrollView
      style={screenStyles.tabContent}
      contentContainerStyle={screenStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={18} color={c.primary} />
          <Text style={styles.cardTitle}>OPERATING HOURS</Text>
        </View>
        {groups.map((group, idx) => (
          <View key={idx} style={styles.hoursRow}>
            <Text style={styles.hoursDay}>{group.label}</Text>
            <Text style={[styles.hoursTime, group.isClosed && { color: c.primary }]}>
              {group.isClosed ? 'Closed' : `${group.open} - ${group.close}`}
            </Text>
          </View>
        ))}
        <TouchableOpacity style={styles.updateHoursBtn} onPress={onOpenHoursModal}>
          <Text style={styles.updateHoursBtnText}>Update Hours</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.performanceCard}>
        <View style={styles.perfHeader}>
          <Text style={styles.perfTitle}>Account Performance</Text>
          <Ionicons name="star" size={24} color="#F59E0B" />
        </View>
        <View style={styles.perfStats}>
          <View style={styles.perfStat}>
            <Text style={styles.perfStatLabel}>MONTHLY RATING</Text>
            <Text style={styles.perfStatValue}>
              {profile.averageRating.toFixed(1)}
              <Text style={styles.perfStatMax}>/5.0</Text>
            </Text>
          </View>
          <View style={styles.perfStat}>
            <Text style={styles.perfStatLabel}>ACTIVE ORDERS</Text>
            <Text style={styles.perfStatValue}>{profile.totalOrders}</Text>
          </View>
        </View>
        <View style={styles.perfBadges}>
          {profile.isPremium ? (
            <View style={styles.perfBadge}>
              <Text style={styles.perfBadgeText}>Premier Partner</Text>
            </View>
          ) : null}
          {profile.averageRating >= 4.5 ? (
            <View style={styles.perfBadge}>
              <Text style={styles.perfBadgeText}>Top 5% Locally</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
