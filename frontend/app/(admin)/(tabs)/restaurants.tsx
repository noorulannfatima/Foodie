import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { adminAPI } from '@/services/api/admin.api';
import type { AdminRestaurant } from '@/services/api/admin.types';
import {
  RestaurantPayoutSheet,
  StatusBadge,
  formatPKR,
  formatPercent,
  useAdminStyles,
} from '@/components/pages/admin';

export default function AdminRestaurantsScreen() {
  const { styles, colors } = useAdminStyles();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<AdminRestaurant | null>(null);

  const load = useCallback(async () => {
    try {
      setRestaurants(await adminAPI.getRestaurants());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleChanged = async (updated: AdminRestaurant) => {
    setSelected(updated);
    // Refetch: a commission change also changes the unsettled amounts
    try {
      const fresh = await adminAPI.getRestaurants();
      setRestaurants(fresh);
      setSelected((current) =>
        current?._id === updated._id ? fresh.find((r) => r._id === updated._id) ?? current : current,
      );
    } catch {
      setRestaurants((list) => list?.map((r) => (r._id === updated._id ? updated : r)) ?? null);
    }
  };

  const pendingFirst = [...(restaurants ?? [])].sort(
    (a, b) =>
      Number(b.payoutAccount?.status === 'Pending') - Number(a.payoutAccount?.status === 'Pending'),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={styles.title}>Restaurants</Text>
        <Text style={styles.subtitle}>Accounts waiting for verification are listed first</Text>
      </View>

      {error ? <Text style={[styles.error, { marginTop: 16 }]}>{error}</Text> : null}

      {restaurants === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={pendingFirst}
          keyExtractor={(r) => r._id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={[styles.empty, { marginTop: 32 }]}>No restaurants yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { gap: 8 }]}
              activeOpacity={0.85}
              onPress={() => setSelected(item)}
            >
              <View style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.amount, item.unsettled.netAmount < 0 && styles.negative]}>
                  {formatPKR(item.unsettled.netAmount)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowSub}>
                  {item.address?.city ? `${item.address.city} · ` : ''}
                  {formatPercent(item.commissionRate)} commission ·{' '}
                  {item.unsettled.orderCount} unsettled
                </Text>
                <StatusBadge status={item.payoutAccount?.status ?? 'None'} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <RestaurantPayoutSheet
        restaurant={selected}
        onClose={() => setSelected(null)}
        onChanged={handleChanged}
      />
    </SafeAreaView>
  );
}
