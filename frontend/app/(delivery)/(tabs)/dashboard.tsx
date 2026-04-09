import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { DeliveryLayout, getDeliveryTabTheme, type DeliveryTabTheme } from '@/constants/deliveryTheme';
import { deliveryAPI, type DeliveryProfile, type DeliveryOrderPayload } from '@/services/api/delivery.api';
import { useAppThemeStore } from '@/stores/appThemeStore';

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function DeliveryDashboard() {
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [active, setActive] = useState<DeliveryOrderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [orderActionBusy, setOrderActionBusy] = useState(false);

  const isDark = useAppThemeStore((s) => s.isDark);
  const theme = useMemo(() => getDeliveryTabTheme(isDark), [isDark]); // same palette factory as Profile / other delivery tabs
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);
  const mapMockGradient = useMemo(
    () =>
      (theme.isDark
        ? ['#2A3441', '#243040', '#1E2836']
        : ['#E8EAED', '#D1D5DB', '#F3F4F6']) as [string, string, string],
    [theme.isDark],
  );
  const statTimeBg = theme.isDark ? 'rgba(166,124,82,0.28)' : '#F5E6D3';

  const load = useCallback(async () => {
    try {
      const [me, act] = await Promise.all([
        deliveryAPI.getMe(),
        deliveryAPI.getActiveOrder(),
      ]);
      setProfile(me.profile);
      setActive(act.order);
    } catch {
      setProfile(null);
      setActive(null);
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

  const toggleOnline = async (next: boolean) => {
    if (!profile) return;
    setOnlineBusy(true);
    try {
      await deliveryAPI.setOnline(next);
      setProfile({ ...profile, isOnline: next });
    } catch {
      /* keep UI */
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
    let next: 'PickedUp' | 'OutForDelivery' | 'Delivered' | null = null;
    if (active.status === 'Confirmed' || active.status === 'Preparing' || active.status === 'Ready') {
      next = 'PickedUp';
    } else if (active.status === 'PickedUp') {
      next = 'OutForDelivery';
    } else if (active.status === 'OutForDelivery') {
      next = 'Delivered';
    }
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

  const orderActionLabel =
    active?.status === 'PickedUp'
      ? 'START DELIVERY'
      : active?.status === 'OutForDelivery'
        ? 'COMPLETE DELIVERY'
        : 'MARK PICKED UP';

  const todayDeliveries =
    profile?.deliveryHistory?.filter((h) => {
      const d = new Date(h.createdAt);
      const t = new Date();
      return d.toDateString() === t.toDateString() && h.status === 'delivered';
    }).length ?? 0;

  const onlineLabel = '5h 20m'; // session timer can be added later; placeholder matches design

  return (
    <View style={styles.root}>
      <DeliveryHeader
        online={profile?.isOnline}
        onOnlineToggle={toggleOnline}
        onlineLoading={onlineBusy}
        avatarUri={profile?.profileImage ?? undefined}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.red} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.pageSub}>Ready for your next pickup?</Text>

        <View style={styles.earnCard}>
          <Text style={styles.earnLabel}>Today&apos;s Earnings</Text>
          <View style={styles.earnRow}>
            <Text style={styles.earnAmt}>
              {loading ? '—' : fmtUsd(profile?.earnings.today ?? 0)}
            </Text>
            <View style={styles.trend}>
              <Ionicons name="trending-up" size={16} color={theme.online} />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.redLight }]}>
              <Ionicons name="car-outline" size={22} color={theme.red} />
            </View>
            <Text style={styles.statLabel}>Deliveries</Text>
            <Text style={styles.statVal}>{loading ? '—' : String(todayDeliveries)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: statTimeBg }]}>
              <Ionicons name="time-outline" size={22} color={theme.brownMuted} />
            </View>
            <Text style={styles.statLabel}>Online Time</Text>
            <Text style={styles.statVal}>{profile?.isOnline ? onlineLabel : '—'}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Active Task</Text>
          <View style={styles.badgeOngoing}>
            <Text style={styles.badgeOngoingText}>ONGOING</Text>
          </View>
        </View>

        {active && active.restaurant ? (
          <View style={styles.taskCard}>
            <LinearGradient colors={mapMockGradient} style={styles.mapMock}>
              <View style={styles.mapPin}>
                <Ionicons name="navigate" size={14} color={theme.red} />
              </View>
              <Text style={styles.mapDist}>2.4 miles away</Text>
            </LinearGradient>

            <Text style={styles.pickupLabel}>PICK UP FROM</Text>
            <Text style={styles.restName}>{active.restaurant.name}</Text>
            <View style={styles.addrRow}>
              <Ionicons name="location-outline" size={16} color={theme.textMuted} />
              <Text style={styles.addrText}>{active.restaurant.addressLine}</Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderHashLabel}>ORDER #</Text>
              <Text style={styles.orderHash}>#{active.orderNumber}</Text>
            </View>

            <View style={styles.itemsBox}>
              <Text style={styles.burgerEmoji}>🍔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemsText}>{active.itemsSummary}</Text>
                <Text style={styles.readyText}>
                  Ready in approx. {active.estimatedPreparationTime ?? 4} mins
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.navBtn}
                onPress={() => openNav(active.restaurant!.addressLine)}
              >
                <Ionicons name="navigate" size={20} color={theme.white} />
                <Text style={styles.navBtnText}>START NAVIGATION</Text>
              </Pressable>
              <Pressable style={styles.callBtn} onPress={() => Linking.openURL('tel:')}>
                <Ionicons name="call" size={22} color={theme.navy} />
              </Pressable>
            </View>
            <Pressable
              style={[styles.statusBtn, orderActionBusy && { opacity: 0.75 }]}
              onPress={advanceOrder}
              disabled={orderActionBusy}
            >
              {orderActionBusy ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={styles.statusBtnText}>{orderActionLabel}</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyTask}>
            <Ionicons name="cube-outline" size={40} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>No active delivery</Text>
            <Text style={styles.emptySub}>Go online and accept an order from the Orders tab.</Text>
          </View>
        )}

        <View style={styles.bonusCard}>
          <Text style={styles.bonusFlame}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bonusTitle}>Peak Hour Bonus</Text>
            <Text style={styles.bonusDesc}>
              Earn an extra <Text style={styles.bonusBold}>+$2.00</Text> per delivery in the Downtown area
              until 9:00 PM.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createDashboardStyles(theme: DeliveryTabTheme) {
  const statusBarBg = theme.isDark ? '#1A3A5C' : '#001F3F';
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.pageBg },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: DeliveryLayout.screenPaddingH,
      paddingBottom: 32,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.navy,
      marginTop: 8,
    },
    pageSub: {
      fontSize: 14,
      color: theme.brownMuted,
      marginTop: 4,
      marginBottom: DeliveryLayout.sectionGap,
    },
    earnCard: {
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    earnLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },
    earnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    earnAmt: { fontSize: 32, fontWeight: '800', color: theme.navy },
    trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendText: { color: theme.online, fontWeight: '700', fontSize: 14 },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
    statCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },
    statVal: { fontSize: 22, fontWeight: '800', color: theme.navy, marginTop: 4 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 26,
      marginBottom: 10,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.navy },
    badgeOngoing: {
      backgroundColor: theme.sky,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeOngoingText: { fontSize: 10, fontWeight: '800', color: theme.navy, letterSpacing: 0.5 },
    taskCard: {
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    mapMock: {
      height: 120,
      borderRadius: 12,
      marginBottom: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mapPin: {
      backgroundColor: theme.white,
      padding: 8,
      borderRadius: 20,
      marginBottom: 6,
    },
    mapDist: { fontSize: 12, fontWeight: '700', color: theme.text },
    pickupLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.red,
      letterSpacing: 1,
      marginBottom: 4,
    },
    restName: { fontSize: 18, fontWeight: '800', color: theme.navy },
    addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
    addrText: { flex: 1, fontSize: 13, color: theme.textMuted, lineHeight: 18 },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    orderHashLabel: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },
    orderHash: { fontSize: 15, fontWeight: '800', color: theme.navy },
    itemsBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: theme.sky,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
    },
    burgerEmoji: { fontSize: 28 },
    itemsText: { fontSize: 14, fontWeight: '700', color: theme.navy, lineHeight: 20 },
    readyText: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    navBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.red,
      paddingVertical: 14,
      borderRadius: 12,
    },
    navBtnText: { color: theme.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
    statusBtn: {
      marginTop: 10,
      backgroundColor: statusBarBg,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    statusBtnText: {
      color: theme.white,
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    callBtn: {
      width: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.skyDeep,
      borderRadius: 12,
    },
    emptyTask: {
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: theme.navy },
    emptySub: { marginTop: 6, fontSize: 13, color: theme.textMuted, textAlign: 'center' },
    bonusCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: theme.peach,
      borderRadius: DeliveryLayout.cardRadius,
      padding: 16,
      marginTop: 22,
      alignItems: 'flex-start',
    },
    bonusFlame: { fontSize: 28 },
    bonusTitle: { fontSize: 16, fontWeight: '800', color: theme.brown },
    bonusDesc: { fontSize: 13, color: theme.brownMuted, marginTop: 4, lineHeight: 20 },
    bonusBold: { fontWeight: '800', color: theme.brown },
  });
}
