import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import { deliveryAPI, type DeliveryProfile, type DeliveryOrderPayload } from '@/services/api/delivery.api';
import {
  DeliveryEarningsCard,
  DeliveryEmptyState,
  DeliveryHistoryRow,
  DeliveryPageHeading,
  DeliveryStatTile,
  WeeklyEarningsChart,
  formatDeliveryCurrency,
} from '@/components/pages/delivery';

/** Monday 00:00 of the current week. */
function startOfWeek(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/** Delivered earnings per day this week, Monday first. */
function weeklyTotals(history: DeliveryProfile['deliveryHistory'] | undefined, weekStart: Date) {
  const days = [0, 0, 0, 0, 0, 0, 0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  for (const h of history ?? []) {
    if (h.status !== 'delivered') continue;
    const at = new Date(h.createdAt);
    if (at < weekStart || at >= weekEnd) continue;
    days[(at.getDay() + 6) % 7] += h.earnings ?? 0;
  }
  return days;
}

export default function DeliveryEarnings() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [tx, setTx] = useState<DeliveryOrderPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.screenBackground },
        loading: { flex: 1, backgroundColor: c.screenBackground },
        scrollContent: { padding: 20, paddingBottom: 40 },
        statsRow: { flexDirection: 'row', gap: 10 },
        section: { marginTop: 24 },
        sectionTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 20,
          color: c.text,
          marginBottom: 12,
        },
      }),
    [c],
  );

  const load = useCallback(async () => {
    try {
      const [me, hist] = await Promise.all([deliveryAPI.getMe(), deliveryAPI.getOrderHistory()]);
      setProfile(me.profile);
      setTx(hist.orders.slice(0, 8));
    } catch {
      /* keep last good data */
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const now = new Date();
  const weekStart = startOfWeek(now);
  const todayIndex = (now.getDay() + 6) % 7;
  if (loading && !profile) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const pending = profile?.earnings.pending ?? 0;
  const week = weeklyTotals(profile?.deliveryHistory, weekStart);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <DeliveryPageHeading title="Earnings" meta={`${fmtDay(weekStart)} – ${fmtDay(weekEnd)}`} />

        <DeliveryEarningsCard
          label="TOTAL EARNED"
          amount={formatDeliveryCurrency(profile?.earnings.total ?? 0)}
          footnoteIcon="time-outline"
          footnote={
            pending > 0 ? `${formatDeliveryCurrency(pending)} pending payout` : 'All earnings paid out'
          }
        />

        <View style={styles.statsRow}>
          <DeliveryStatTile label="TODAY" value={formatDeliveryCurrency(profile?.earnings.today ?? 0)} icon="today-outline" />
          <DeliveryStatTile
            label="THIS WEEK"
            value={formatDeliveryCurrency(profile?.earnings.thisWeek ?? 0)}
            icon="calendar-outline"
          />
          <DeliveryStatTile
            label="THIS MONTH"
            value={formatDeliveryCurrency(profile?.earnings.thisMonth ?? 0)}
            icon="stats-chart-outline"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <WeeklyEarningsChart days={week} todayIndex={todayIndex} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payouts</Text>
          {tx.length === 0 ? (
            <DeliveryEmptyState
              framed
              icon="wallet-outline"
              title="No payouts yet"
              message="Earnings from completed deliveries show up here."
            />
          ) : (
            tx.map((t) => <DeliveryHistoryRow key={t.id} order={t} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}
