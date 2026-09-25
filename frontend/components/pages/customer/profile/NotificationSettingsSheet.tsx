import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import type { CustomerNotificationPreferences } from '@/services/api/customer.api';
import type { CustomerStringKey } from '@/constants/customerStrings';
import { useCustomerPreferencesStore, useCustomerT } from '@/stores/customerPreferencesStore';
import { registerCustomerPushNotifications } from '@/services/pushNotifications';

interface NotificationSettingsSheetProps {
  onClose: () => void;
}

type Key = keyof CustomerNotificationPreferences;

const CATEGORY_ROWS: { key: Exclude<Key, 'push'>; icon: 'receipt-outline' | 'pricetag-outline'; label: CustomerStringKey; hint: CustomerStringKey }[] = [
  { key: 'orderUpdates', icon: 'receipt-outline', label: 'orderUpdates', hint: 'orderUpdatesHint' },
  { key: 'promotions', icon: 'pricetag-outline', label: 'promotions', hint: 'promotionsHint' },
];

export default function NotificationSettingsSheet({ onClose }: NotificationSettingsSheetProps) {
  const { Colors } = useCustomerProfileStyles();
  const t = useCustomerT();
  const notifications = useCustomerPreferencesStore((s) => s.notifications);
  const load = useCustomerPreferencesStore((s) => s.load);
  const setNotification = useCustomerPreferencesStore((s) => s.setNotification);
  const [pending, setPending] = useState<Partial<Record<Key, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [osBlocked, setOsBlocked] = useState(false);

  const checkPermission = useCallback(async () => {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    setOsBlocked(status === 'denied' && !canAskAgain);
  }, []);

  useEffect(() => {
    load().catch(() => {}); // Keep the cached copy if offline
    checkPermission();
    // Re-check after the user comes back from the phone's settings
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermission();
    });
    return () => sub.remove();
  }, [load, checkPermission]);

  const toggle = async (key: Key, value: boolean) => {
    setError(null);
    setPending((p) => ({ ...p, [key]: true }));
    try {
      await setNotification(key, value);
      // Turning push back on: make sure this device is registered
      if (key === 'push' && value) registerCustomerPushNotifications();
    } catch {
      setError(t('notificationsSaveFailed'));
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surface,
        },
        title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
        spacer: { width: 24 },
        content: { padding: 20, paddingBottom: 40, gap: 16 },
        card: {
          backgroundColor: Colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 18,
          gap: 12,
        },
        rowDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
        rowText: { flex: 1 },
        rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
        rowHint: { fontSize: 12, color: Colors.textMuted, marginTop: 3, lineHeight: 16 },
        disabled: { opacity: 0.45 },
        banner: {
          flexDirection: 'row',
          gap: 10,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#F59E0B',
          backgroundColor: Colors.surface,
        },
        bannerText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
        bannerLink: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 6 },
        error: { fontSize: 13, color: Colors.primary, lineHeight: 18 },
        footnote: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
      }),
    [Colors],
  );

  const switchProps = (key: Key, disabled = false) => ({
    value: notifications[key],
    onValueChange: (value: boolean) => toggle(key, value),
    disabled: disabled || pending[key],
    trackColor: { false: Colors.border, true: Colors.brand },
    thumbColor: '#FFFFFF',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notificationsTitle')}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {osBlocked ? (
          <View style={styles.banner}>
            <Ionicons name="notifications-off-outline" size={18} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerText}>{t('notificationsBlocked')}</Text>
              <TouchableOpacity onPress={() => Linking.openSettings()} accessibilityRole="link">
                <Text style={styles.bannerLink}>{t('openSettings')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={20} color={Colors.neutral} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('pushNotifications')}</Text>
              <Text style={styles.rowHint}>{t('pushNotificationsHint')}</Text>
            </View>
            <Switch {...switchProps('push')} accessibilityLabel={t('pushNotifications')} />
          </View>
        </View>

        <View style={[styles.card, !notifications.push && styles.disabled]}>
          {CATEGORY_ROWS.map((row, index) => (
            <View key={row.key} style={[styles.row, index > 0 && styles.rowDivider]}>
              <Ionicons name={row.icon} size={20} color={Colors.neutral} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{t(row.label)}</Text>
                <Text style={styles.rowHint}>{t(row.hint)}</Text>
              </View>
              <Switch {...switchProps(row.key, !notifications.push)} accessibilityLabel={t(row.label)} />
            </View>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.footnote}>{t('notificationsSaved')}</Text>
      </ScrollView>
    </View>
  );
}
