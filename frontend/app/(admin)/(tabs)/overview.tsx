import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { adminAPI } from '@/services/api/admin.api';
import type { AdminOverview } from '@/services/api/admin.types';
import { AdminStatBox, formatPKR, useAdminStyles } from '@/components/pages/admin';

export default function AdminOverviewScreen() {
  const { styles, colors } = useAdminStyles();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setOverview(await adminAPI.getOverview());
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

  const runGenerate = async () => {
    setGenerating(true);
    try {
      const created = await adminAPI.generatePayouts();
      await load();
      Alert.alert(
        created.length ? 'Payouts created' : 'Nothing to settle',
        created.length
          ? `${created.length} payout${created.length === 1 ? '' : 's'} created. Review them in the Payouts tab.`
          : 'No delivered orders are waiting to be settled.',
        created.length
          ? [
              { text: 'Later', style: 'cancel' },
              { text: 'View payouts', onPress: () => router.navigate('/(admin)/(tabs)/payouts') },
            ]
          : undefined,
      );
    } catch (e: any) {
      Alert.alert('Could not generate payouts', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const confirmGenerate = () => {
    Alert.alert(
      'Generate payouts?',
      'Every delivered order not yet settled will be grouped into one payout per restaurant.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: runGenerate },
      ],
    );
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View>
          <Text style={styles.title}>Payouts overview</Text>
          <Text style={styles.subtitle}>Signed in as {user?.name ?? 'admin'}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!overview && !error ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : overview ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AdminStatBox
                icon="hourglass-outline"
                color="#7C3AED"
                lightBg="#EDE9FE"
                label="Unsettled net"
                value={formatPKR(overview.unsettledNet)}
                caption={`${overview.unsettledOrders} delivered orders`}
              />
              <AdminStatBox
                icon="sync-outline"
                color="#D97706"
                lightBg="#FEF3C7"
                label="Processing"
                value={formatPKR(overview.processingAmount)}
                caption={`${overview.processingCount} payouts to send`}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AdminStatBox
                icon="checkmark-done-outline"
                color="#059669"
                lightBg="#D1FAE5"
                label="Paid this month"
                value={formatPKR(overview.paidThisMonth)}
              />
              <AdminStatBox
                icon="shield-outline"
                color="#2563EB"
                lightBg="#DBEAFE"
                label="Accounts to verify"
                value={String(overview.pendingAccounts)}
                caption="Pending payout accounts"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 8 }]}
              onPress={confirmGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="layers-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Generate payouts</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.rowSub, { textAlign: 'center' }]}>
              Settles delivered orders up to now. Cash orders count toward commission only.
            </Text>
          </>
        ) : null}

        <TouchableOpacity style={[styles.outlineBtn, { marginTop: 24 }]} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.primary} />
          <Text style={styles.outlineBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
