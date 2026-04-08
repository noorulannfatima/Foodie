import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { DeliveryColors, DeliveryLayout } from '@/constants/deliveryTheme';
import { deliveryAPI, type DeliveryOrderPayload } from '@/services/api/delivery.api';

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function DeliveryOrders() {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [requests, setRequests] = useState<DeliveryOrderPayload[]>([]);
  const [history, setHistory] = useState<DeliveryOrderPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [req, hist] = await Promise.all([
        deliveryAPI.getOrderRequests(),
        deliveryAPI.getOrderHistory(),
      ]);
      setRequests(req.orders);
      setHistory(hist.orders);
    } catch {
      setRequests([]);
      setHistory([]);
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

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      await deliveryAPI.acceptOrder(id);
      Alert.alert('Order accepted', 'Pick it up at the restaurant when ready.');
      await load();
    } catch (e: unknown) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <View style={styles.root}>
      <DeliveryHeader
        subtitleRow={
          <View style={styles.headerLower}>
            <View>
              <Text style={styles.liveLabel}>LIVE DISPATCH</Text>
              <Text style={styles.consoleTitle}>Order Console</Text>
            </View>
            <View style={styles.readyPill}>
              <View style={styles.dot} />
              <Text style={styles.readyText}>ONLINE & READY</Text>
            </View>
          </View>
        }
      />

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('new')}
          style={[styles.tabBtn, tab === 'new' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'new' && styles.tabTextActive]}>New Requests</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('history')}
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Delivery History
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DeliveryColors.red} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapCard}>
          <LinearGradient colors={['#C5D4E8', '#9EB5D1', '#D8E4F2']} style={styles.mapInner}>
            <View style={styles.locBox}>
              <Text style={styles.locLabel}>YOUR LOCATION</Text>
              <Text style={styles.locVal}>Downtown Sector 4</Text>
            </View>
          </LinearGradient>
          <LinearGradient colors={[DeliveryColors.navy, '#0A2850']} style={styles.zoneBanner}>
            <Text style={styles.zoneText}>Active Zone Boost</Text>
            <Text style={styles.zoneMult}>+1.5x</Text>
          </LinearGradient>
        </View>

        {tab === 'new' ? (
          <>
            {requests.length === 0 && !loading ? (
              <Text style={styles.empty}>No open requests nearby. Pull to refresh.</Text>
            ) : null}
            {requests.map((o, index) => (
              <View key={o.id} style={styles.orderCard}>
                <View style={styles.imgWrap}>
                  {o.restaurant?.image ? (
                    <Image source={{ uri: o.restaurant.image }} style={styles.foodImg} />
                  ) : (
                    <View style={[styles.foodImg, styles.imgPh]}>
                      <Ionicons name="fast-food-outline" size={40} color={DeliveryColors.navy} />
                    </View>
                  )}
                  {o.tag === 'HOT_ORDER' ? (
                    <View style={styles.hotRibbon}>
                      <Text style={styles.hotText}>HOT ORDER</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.restTitle}>{o.restaurant?.name}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="navigate-outline" size={14} color={DeliveryColors.textMuted} />
                  <Text style={styles.metaText}>{o.milesAway?.toFixed(1) ?? '—'} miles away</Text>
                  <Text style={styles.metaSep}> </Text>
                  <Ionicons name="time-outline" size={14} color={DeliveryColors.textMuted} />
                  <Text style={styles.metaText}>{o.prepMinutes ?? o.estimatedPreparationTime} min prep</Text>
                </View>
                <Text style={styles.payout}>
                  EST. PAYOUT <Text style={styles.payoutAmt}>{fmtUsd(o.estPayout)}</Text>
                </Text>
                {index === 2 ? (
                  <Pressable style={styles.btnSecondary} onPress={() => accept(o.id)}>
                    <Text style={styles.btnSecondaryText}>Add to Route</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.btnPrimary, accepting === o.id && { opacity: 0.7 }]}
                    onPress={() => accept(o.id)}
                    disabled={accepting === o.id}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {accepting === o.id ? '…' : 'Accept Order'}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </>
        ) : (
          <>
            {history.length === 0 && !loading ? (
              <Text style={styles.empty}>No completed deliveries yet.</Text>
            ) : null}
            {history.map((o) => (
              <View key={o.id} style={styles.orderCard}>
                <View style={styles.historyRow}>
                  <View style={styles.imgWrapSmall}>
                    {o.restaurant?.image ? (
                      <Image source={{ uri: o.restaurant.image }} style={styles.foodImg} />
                    ) : (
                      <View style={[styles.foodImg, styles.imgPh]}>
                        <Ionicons name="checkmark-circle" size={32} color={DeliveryColors.online} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.restTitle}>{o.restaurant?.name}</Text>
                    <Text style={styles.metaText}>#{o.orderNumber} • Delivered</Text>
                  </View>
                  <Text style={styles.histAmt}>+{fmtUsd(o.driverEarnings ?? o.estPayout)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DeliveryColors.pageBg },
  headerLower: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: DeliveryColors.brownMuted,
    letterSpacing: 1,
  },
  consoleTitle: { fontSize: 22, fontWeight: '800', color: DeliveryColors.white, marginTop: 4 },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DeliveryColors.online },
  readyText: { fontSize: 10, fontWeight: '800', color: DeliveryColors.white, letterSpacing: 0.5 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: DeliveryLayout.screenPaddingH,
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: DeliveryColors.sky,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: DeliveryColors.card },
  tabText: { fontSize: 13, fontWeight: '700', color: DeliveryColors.navy },
  tabTextActive: { color: DeliveryColors.red },
  scroll: { paddingHorizontal: DeliveryLayout.screenPaddingH, paddingBottom: 32 },
  mapCard: { borderRadius: DeliveryLayout.cardRadius, overflow: 'hidden', marginBottom: 18 },
  mapInner: { height: 140, justifyContent: 'flex-start', padding: 12 },
  locBox: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locLabel: { fontSize: 10, fontWeight: '800', color: DeliveryColors.brownMuted, letterSpacing: 0.5 },
  locVal: { fontSize: 14, fontWeight: '800', color: DeliveryColors.text, marginTop: 2 },
  zoneBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  zoneText: { color: DeliveryColors.white, fontWeight: '700', fontSize: 13 },
  zoneMult: { color: DeliveryColors.gold, fontWeight: '900', fontSize: 16 },
  empty: { textAlign: 'center', color: DeliveryColors.textMuted, marginVertical: 20 },
  orderCard: {
    backgroundColor: DeliveryColors.card,
    borderRadius: DeliveryLayout.cardRadius,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imgWrap: { position: 'relative', marginBottom: 10 },
  imgWrapSmall: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  foodImg: { width: '100%', height: 140, borderRadius: 12 },
  imgPh: {
    backgroundColor: DeliveryColors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  hotRibbon: {
    position: 'absolute',
    top: 10,
    right: -6,
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    transform: [{ rotate: '12deg' }],
  },
  hotText: { color: DeliveryColors.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  restTitle: { fontSize: 17, fontWeight: '800', color: DeliveryColors.navy },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  metaText: { fontSize: 12, color: DeliveryColors.textMuted, fontWeight: '600' },
  metaSep: { width: 4 },
  payout: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    color: DeliveryColors.textMuted,
    letterSpacing: 0.5,
  },
  payoutAmt: { color: DeliveryColors.red, fontSize: 16 },
  btnPrimary: {
    marginTop: 12,
    backgroundColor: DeliveryColors.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: DeliveryColors.white, fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
  btnSecondary: {
    marginTop: 12,
    backgroundColor: DeliveryColors.skyDeep,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: { color: DeliveryColors.navy, fontWeight: '900', fontSize: 15 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  histAmt: { fontSize: 16, fontWeight: '800', color: DeliveryColors.red },
});
