import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { adminAPI } from '@/services/api/admin.api';
import type { AdminPayout, PayoutStatus } from '@/services/api/admin.types';
import {
  PayoutDetailSheet,
  StatusBadge,
  formatPKR,
  formatPeriod,
  useAdminStyles,
} from '@/components/pages/admin';

const FILTERS: (PayoutStatus | 'All')[] = ['All', 'Processing', 'Paid', 'Failed'];

export default function AdminPayoutsScreen() {
  const { styles, colors } = useAdminStyles();
  const [filter, setFilter] = useState<PayoutStatus | 'All'>('All');
  const [payouts, setPayouts] = useState<AdminPayout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPayouts(await adminAPI.getPayouts(filter === 'All' ? undefined : filter));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [filter]);

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

  const changeFilter = (next: PayoutStatus | 'All') => {
    if (next === filter) return;
    setPayouts(null);
    setFilter(next);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <Text style={styles.title}>Payouts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => changeFilter(f)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.border,
                  backgroundColor: active ? colors.brand : colors.card,
                }}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.brandBold,
                    fontSize: 13,
                    color: active ? '#FFFFFF' : colors.text,
                  }}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? <Text style={[styles.error, { marginTop: 16 }]}>{error}</Text> : null}

      {payouts === null && !error ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={payouts ?? []}
          keyExtractor={(p) => p._id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { marginTop: 32 }]}>
              {filter === 'All'
                ? 'No payouts yet. Generate them from the Overview tab.'
                : `No ${filter.toLowerCase()} payouts.`}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { gap: 8 }]}
              activeOpacity={0.85}
              onPress={() => setSelectedId(item._id)}
            >
              <View style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.restaurant?.name ?? 'Deleted restaurant'}
                </Text>
                <Text style={[styles.amount, item.netAmount < 0 && styles.negative]}>
                  {formatPKR(item.netAmount)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowSub}>
                  {formatPeriod(item.periodStart, item.periodEnd)} · {item.orderCount} orders
                </Text>
                <StatusBadge status={item.status} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <PayoutDetailSheet
        payoutId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </SafeAreaView>
  );
}
