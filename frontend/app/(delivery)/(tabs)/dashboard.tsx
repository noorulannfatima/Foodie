import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Linking, Alert, AppState, Modal } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import {
  deliveryAPI,
  type ActiveOrderResponse,
  type CancelledDeliveryPayload,
  type DeliveryProfile,
  type DeliveryOrderPayload,
  type DeliveryReleaseReason,
} from '@/services/api/delivery.api';
import { RecentReviewsSection, type RecentReview } from '@/components/pages/reviews';
import {
  ActiveDeliveryCard,
  buildNavigationUrl,
  CancelledDeliveryCard,
  DeliveryEarningsCard,
  DeliveryEmptyState,
  DeliveryOnlineToggle,
  DeliveryPageHeading,
  DeliveryReleaseSheet,
  DeliveryStatTile,
  formatDeliveryCurrency,
  getDeliveryStep,
  isAwaitingPickup,
  useDeliveryReviewPalette,
  type NavigationTarget,
} from '@/components/pages/delivery';

type NextDeliveryStatusBody = {
  status: Parameters<typeof deliveryAPI.updateOrderStatus>[1];
  cashCollected?: boolean;
};

/** How often to check whether the restaurant has marked the order ready. */
const READY_POLL_MS = 15000;

export default function DeliveryDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useAppThemeColors();
  const reviewPalette = useDeliveryReviewPalette();

  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [active, setActive] = useState<DeliveryOrderPayload | null>(null);
  const [cancelled, setCancelled] = useState<CancelledDeliveryPayload | null>(null);
  const [dismissBusy, setDismissBusy] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
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

  const applyActive = useCallback((act: ActiveOrderResponse) => {
    setActive(act.order);
    setCancelled(act.cancelledOrder);
  }, []);

  const load = useCallback(async () => {
    try {
      const [me, act] = await Promise.all([deliveryAPI.getMe(), deliveryAPI.getActiveOrder()]);
      setProfile(me.profile);
      applyActive(act);
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
  }, [applyActive]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Pickup unlocks when the restaurant marks the order ready, and nothing pushes
  // that to the rider, so poll while waiting (focused + foregrounded only)
  const waitingForFood = active ? isAwaitingPickup(active.status) : false;
  useFocusEffect(
    useCallback(() => {
      if (!waitingForFood) return;
      const handle = setInterval(async () => {
        if (AppState.currentState !== 'active') return;
        try {
          applyActive(await deliveryAPI.getActiveOrder());
        } catch {
          /* try again next tick */
        }
      }, READY_POLL_MS);
      return () => clearInterval(handle);
    }, [waitingForFood, applyActive]),
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

  const openNav = (target: NavigationTarget) => {
    Linking.openURL(buildNavigationUrl(target));
  };

  const sendStatus = async (order: DeliveryOrderPayload, body: NextDeliveryStatusBody) => {
    setOrderActionBusy(true);
    try {
      await deliveryAPI.updateOrderStatus(order.id, body.status, { cashCollected: body.cashCollected });
      await load();
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again.');
      await load();
    } finally {
      setOrderActionBusy(false);
    }
  };

  const advanceOrder = () => {
    if (!active) return;
    const next = getDeliveryStep(active.status).next;
    if (!next) return;
    // A cash order is only complete once the money is in hand
    if (next === 'Delivered' && active.cashToCollect > 0) {
      const amount = formatDeliveryCurrency(active.cashToCollect);
      Alert.alert(
        `Collect ${amount} in cash`,
        `Only mark this order delivered after the customer has paid you ${amount}.`,
        [
          { text: 'Not yet', style: 'cancel' },
          { text: 'Cash collected', onPress: () => sendStatus(active, { status: next, cashCollected: true }) },
        ],
      );
      return;
    }
    sendStatus(active, { status: next });
  };

  const releaseActive = async (reason: DeliveryReleaseReason) => {
    if (!active) return;
    try {
      await deliveryAPI.releaseOrder(active.id, reason);
    } catch (e) {
      Alert.alert('Could not release order', e instanceof Error ? e.message : 'Try again.');
    }
    await load();
  };

  const dismissCancelled = async () => {
    if (!cancelled) return;
    setDismissBusy(true);
    try {
      await deliveryAPI.acknowledgeCancellation(cancelled.id);
      setCancelled(null);
    } catch (e) {
      Alert.alert('Could not dismiss', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setDismissBusy(false);
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
          {cancelled ? (
            <CancelledDeliveryCard order={cancelled} busy={dismissBusy} onDismiss={dismissCancelled} />
          ) : null}
          {active && active.restaurant ? (
            <ActiveDeliveryCard
              order={active}
              busy={orderActionBusy}
              onAdvance={advanceOrder}
              onNavigate={openNav}
              onRelease={() => setReleaseOpen(true)}
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

      <Modal
        visible={releaseOpen && active !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReleaseOpen(false)}
      >
        {active ? (
          <DeliveryReleaseSheet
            orderNumber={active.orderNumber}
            onChoose={releaseActive}
            onClose={() => setReleaseOpen(false)}
          />
        ) : null}
      </Modal>
    </View>
  );
}
