import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Linking, Platform, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import { deliveryAPI, type DeliveryProfile, type DeliveryOrderPayload } from '@/services/api/delivery.api';
import { RecentReviewsSection, type RecentReview } from '@/components/pages/reviews';
import {
  ActiveDeliveryCard,
  DeliveryEarningsCard,
  DeliveryEmptyState,
  DeliveryOnlineToggle,
  DeliveryPageHeading,
  DeliveryStatTile,
  formatDeliveryCurrency,
  getDeliveryStep,
  useDeliveryReviewPalette,
} from '@/components/pages/delivery';

export default function DeliveryDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useAppThemeColors();
  const reviewPalette = useDeliveryReviewPalette();

  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [active, setActive] = useState<DeliveryOrderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [orderActionBusy, setOrderActionBusy] = useState(false);
  const [recentReviews, setRecentReviews] = useState<RecentReview[] | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.screenBackground },
        loading: { flex: 1, backgroundColor: c.screenBackground },
        scrollContent: { padding: 20, paddingBottom: 40 },
        statsRow: { flexDirection: 'row', gap: 10 },
        sectionTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 20,
          color: c.text,
          marginBottom: 12,
        },
        section: { marginTop: 24 },
      }),
    [c],
  );

  const load = useCallback(async () => {
    try {
      const [me, act] = await Promise.all([deliveryAPI.getMe(), deliveryAPI.getActiveOrder()]);
      setProfile(me.profile);
      setActive(act.order);
    } catch {
      setActive(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Separate so a reviews failure never blanks the rest of the dashboard
    try {
      const res = await deliveryAPI.getReviews(1, 3);
      setRecentReviews(
        res.reviews.map((r) => ({
          ...r,
          title: r.orderNumber ? `Order #${r.orderNumber}` : undefined,
        })),
      );
    } catch {
      /* section stays hidden */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleOnline = async (next: boolean) => {
    if (!profile) return;
    setOnlineBusy(true);
    try {
      await deliveryAPI.setOnline(next);
      setProfile({ ...profile, isOnline: next });
    } catch (e) {
      Alert.alert(
        next ? 'Could not go online' : 'Could not go offline',
        e instanceof Error ? e.message : 'Check your connection and try again.',
      );
    } finally {
      setOnlineBusy(false);
    }
  };

  const openNav = (address: string) => {
    const q = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${q}`,
      android: `geo:0,0?q=${q}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q}`,
    });
    if (url) Linking.openURL(url);
  };

  const advanceOrder = async () => {
    if (!active) return;
    const next = getDeliveryStep(active.status).next;
    if (!next) return;
    setOrderActionBusy(true);
    try {
      await deliveryAPI.updateOrderStatus(active.id, next);
      await load();
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setOrderActionBusy(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  const today = new Date();
  const todayDeliveries =
    profile?.deliveryHistory?.filter(
      (h) => h.status === 'delivered' && new Date(h.createdAt).toDateString() === today.toDateString(),
    ).length ?? 0;
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hasRating = (profile?.stats.totalRatings ?? 0) > 0;
  const online = profile?.isOnline ?? false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <DeliveryPageHeading
          title={profile?.name ? `Hi, ${profile.name.split(' ')[0]}` : 'Dashboard'}
          meta={dateStr}
          right={
            profile ? <DeliveryOnlineToggle online={online} busy={onlineBusy} onChange={toggleOnline} /> : null
          }
        />

        <DeliveryEarningsCard
          label="TODAY'S EARNINGS"
          amount={formatDeliveryCurrency(profile?.earnings.today ?? 0)}
          footnote={`${todayDeliveries} ${todayDeliveries === 1 ? 'delivery' : 'deliveries'} today`}
        />

        <View style={styles.statsRow}>
          <DeliveryStatTile
            label="THIS WEEK"
            value={formatDeliveryCurrency(profile?.earnings.thisWeek ?? 0)}
            icon="trending-up"
          />
          <DeliveryStatTile
            label="COMPLETED"
            value={String(profile?.stats.completedDeliveries ?? 0)}
            icon="checkmark-done-outline"
          />
          <DeliveryStatTile
            label="RATING"
            value={hasRating ? profile!.stats.averageRating.toFixed(1) : 'New'}
            icon="star-outline"
            onPress={() => router.push('/(delivery)/reviews')}
            accessibilityLabel={
              hasRating
                ? `Rating ${profile!.stats.averageRating.toFixed(1)} from ${profile!.stats.totalRatings} ratings. View ratings`
                : 'No ratings yet. View ratings'
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Delivery</Text>
          {active && active.restaurant ? (
            <ActiveDeliveryCard
              order={active}
              busy={orderActionBusy}
              onAdvance={advanceOrder}
              onNavigate={openNav}
            />
          ) : online ? (
            <DeliveryEmptyState
              framed
              icon="bicycle-outline"
              title="No active delivery"
              message="Accept a nearby request to start your next run."
              actionLabel="See requests"
              onAction={() => router.push('/(delivery)/(tabs)/orders')}
            />
          ) : (
            <DeliveryEmptyState
              framed
              icon="moon-outline"
              title="You're offline"
              message="Go online to start receiving delivery requests."
              actionLabel="Go online"
              onAction={() => toggleOnline(true)}
            />
          )}
        </View>

        <RecentReviewsSection
          reviews={recentReviews}
          onSeeAll={() => router.push('/(delivery)/reviews')}
          palette={reviewPalette}
          titleStyle={styles.sectionTitle}
        />
      </ScrollView>
    </View>
  );
}
