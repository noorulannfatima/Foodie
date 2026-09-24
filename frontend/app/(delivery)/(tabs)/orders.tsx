import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppThemeColors } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import { deliveryAPI, type DeliveryOrderPayload } from '@/services/api/delivery.api';
import {
  DeliveryEmptyState,
  DeliveryHistoryRow,
  DeliveryOnlineStatus,
  DeliveryPageHeading,
  DeliveryRequestCard,
  DeliverySegmentedTabs,
} from '@/components/pages/delivery';

type TabKey = 'new' | 'history';

export default function DeliveryOrders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useAppThemeColors();
  const [tab, setTab] = useState<TabKey>('new');
  const [requests, setRequests] = useState<DeliveryOrderPayload[]>([]);
  const [history, setHistory] = useState<DeliveryOrderPayload[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: c.screenBackground },
        top: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
        list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },
        loadingWrap: { paddingVertical: 60 },
      }),
    [c],
  );

  const load = useCallback(async () => {
    try {
      const [req, hist, me, act] = await Promise.all([
        deliveryAPI.getOrderRequests(),
        deliveryAPI.getOrderHistory(),
        deliveryAPI.getMe(),
        deliveryAPI.getActiveOrder(),
      ]);
      setRequests(req.orders);
      setHistory(hist.orders);
      setOnline(me.profile.isOnline);
      setHasActive(Boolean(act.order));
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

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      await deliveryAPI.acceptOrder(id);
      router.navigate('/(delivery)/(tabs)/dashboard');
    } catch (e: unknown) {
      Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again.');
      await load();
    } finally {
      setAccepting(null);
    }
  };

  const renderRequests = () => {
    if (hasActive) {
      return (
        <DeliveryEmptyState
          icon="bicycle-outline"
          title="Finish your current run"
          message="You can accept a new request once the active delivery is complete."
          actionLabel="Open active delivery"
          onAction={() => router.navigate('/(delivery)/(tabs)/dashboard')}
        />
      );
    }
    if (online === false) {
      return (
        <DeliveryEmptyState
          icon="moon-outline"
          title="You're offline"
          message="Go online from the Dashboard to start taking requests."
          actionLabel="Go to Dashboard"
          onAction={() => router.navigate('/(delivery)/(tabs)/dashboard')}
        />
      );
    }
    if (requests.length === 0) {
      return (
        <DeliveryEmptyState
          icon="receipt-outline"
          title="No requests right now"
          message="New orders appear here as restaurants confirm them. Pull down to refresh."
        />
      );
    }
    return requests.map((o) => (
      <DeliveryRequestCard
        key={o.id}
        order={o}
        accepting={accepting === o.id}
        disabled={accepting !== null}
        onAccept={() => accept(o.id)}
      />
    ));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <DeliveryPageHeading
          title="Orders"
          right={online === null ? null : <DeliveryOnlineStatus online={online} />}
        />
        <DeliverySegmentedTabs<TabKey>
          tabs={[
            { key: 'new', label: requests.length ? `Requests (${requests.length})` : 'Requests' },
            { key: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        contentContainerStyle={styles.list}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <Loader />
          </View>
        ) : tab === 'new' ? (
          renderRequests()
        ) : history.length === 0 ? (
          <DeliveryEmptyState
            icon="checkmark-done-outline"
            title="No deliveries yet"
            message="Completed deliveries and what you earned from each show up here."
          />
        ) : (
          history.map((o) => <DeliveryHistoryRow key={o.id} order={o} />)
        )}
      </ScrollView>
    </View>
  );
}
