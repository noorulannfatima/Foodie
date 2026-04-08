import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { DeliveryColors, DeliveryLayout } from '@/constants/deliveryTheme';
import { deliveryAPI, type DeliveryProfile, type DeliveryOrderPayload } from '@/services/api/delivery.api';

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function DeliveryEarnings() {
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [tx, setTx] = useState<DeliveryOrderPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, hist] = await Promise.all([deliveryAPI.getMe(), deliveryAPI.getOrderHistory()]);
      setProfile(me.profile);
      setTx(hist.orders.slice(0, 8));
    } catch {
      setProfile(null);
      setTx([]);
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

  const weekOf = new Date();
  const weekLabel = `Week of ${weekOf.toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
  const todayIdx = (weekOf.getDay() + 6) % 7;

  const total = profile?.earnings.total ?? 0;

  return (
    <View style={styles.root}>
      <DeliveryHeader avatarUri={profile?.profileImage ?? undefined} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DeliveryColors.red} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#001F3F', '#0A2850']} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceMain}>{loading ? '—' : fmtUsd(total)}</Text>
          </View>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={16} color={DeliveryColors.gold} />
            <Text style={styles.trendText}>+12.5% vs last week</Text>
          </View>
          <Pressable style={styles.cashOut} onPress={() => {}}>
            <Ionicons name="wallet-outline" size={18} color={DeliveryColors.white} />
            <Text style={styles.cashOutText}>Cash Out</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.weekHead}>
          <Text style={styles.weekTitle}>Weekly Performance</Text>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>{weekLabel}</Text>
          </View>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
              {DAYS.map((d, i) => (
                <View key={d} style={styles.barCol}>
                  <View style={[styles.bar, i === todayIdx && styles.barActive]} />
                  <Text style={[styles.barLabel, i === todayIdx && styles.barLabelActive]}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.txTitle}>Recent Transactions</Text>
        {tx.length === 0 && !loading ? (
          <Text style={styles.empty}>No completed deliveries yet.</Text>
        ) : null}
        {tx.map((t) => (
          <View key={t.id} style={styles.txRow}>
            <View style={styles.thumb}>
              {t.restaurant?.image ? (
                <Image source={{ uri: t.restaurant.image }} style={styles.thumbImg} />
              ) : (
                <Ionicons name="restaurant" size={28} color={DeliveryColors.navy} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txRest}>{t.restaurant?.name ?? 'Restaurant'}</Text>
              <Text style={styles.txMeta}>
                Order #{t.orderNumber} • {t.milesAway?.toFixed(1) ?? '—'} miles
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.txAmt}>+{fmtUsd(t.driverEarnings ?? t.estPayout)}</Text>
              <Text style={styles.txStatus}>COMPLETED</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DeliveryColors.pageBg },
  content: { paddingHorizontal: DeliveryLayout.screenPaddingH, paddingBottom: 32 },
  balanceCard: {
    borderRadius: DeliveryLayout.cardRadius,
    padding: 20,
    marginTop: 8,
    marginBottom: 22,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balanceRow: { marginTop: 8 },
  balanceMain: { fontSize: 34, fontWeight: '800', color: DeliveryColors.white },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  trendText: { color: DeliveryColors.gold, fontSize: 13, fontWeight: '600' },
  cashOut: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DeliveryColors.red,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cashOutText: { color: DeliveryColors.white, fontWeight: '800', fontSize: 14 },
  weekHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekTitle: { fontSize: 18, fontWeight: '800', color: DeliveryColors.navy },
  weekBadge: {
    backgroundColor: DeliveryColors.redLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  weekBadgeText: { fontSize: 12, fontWeight: '700', color: DeliveryColors.red },
  chartCard: {
    backgroundColor: DeliveryColors.card,
    borderRadius: DeliveryLayout.cardRadius,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartPlaceholder: { minHeight: 120, justifyContent: 'flex-end' },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  bar: {
    width: 8,
    height: 40,
    backgroundColor: DeliveryColors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  barActive: { height: 72, backgroundColor: DeliveryColors.red },
  barLabel: { fontSize: 10, color: DeliveryColors.textMuted, fontWeight: '600' },
  barLabelActive: { color: DeliveryColors.red, fontWeight: '800' },
  txTitle: { fontSize: 18, fontWeight: '800', color: DeliveryColors.navy, marginBottom: 12 },
  empty: { fontSize: 14, color: DeliveryColors.textMuted, marginBottom: 12 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DeliveryColors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: DeliveryColors.sky,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  txRest: { fontSize: 15, fontWeight: '800', color: DeliveryColors.navy },
  txMeta: { fontSize: 12, color: DeliveryColors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '800', color: DeliveryColors.red },
  txStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: DeliveryColors.brownMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
