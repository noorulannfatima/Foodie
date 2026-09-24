import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, tintBg, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useAppThemeStore } from '@/stores/appThemeStore';
import { useRestaurantStore } from '@/stores/restaurantStore';
import {
  NOTIFICATION_CHANNEL_KEYS,
  NOTIFICATION_PREFERENCE_SECTIONS,
  withNotificationDefaults,
  type NotificationPreferenceKey,
} from './notificationPreferences';

export interface NotificationPreferencesModalProps {
  onClose: () => void;
}

export default function NotificationPreferencesModal({ onClose }: NotificationPreferencesModalProps) {
  const c = useAppThemeColors();
  const isDark = useAppThemeStore((s) => s.isDark);
  const styles = useMemo(() => createStyles(c), [c]);

  const storedPreferences = useRestaurantStore((s) => s.notificationPreferences);
  const profilePreferences = useRestaurantStore((s) => s.profile?.notificationPreferences);
  const loading = useRestaurantStore((s) => s.notificationPreferencesLoading);
  const fetchNotificationPreferences = useRestaurantStore((s) => s.fetchNotificationPreferences);
  const updateNotificationPreferences = useRestaurantStore((s) => s.updateNotificationPreferences);

  const [pendingKeys, setPendingKeys] = useState<Partial<Record<NotificationPreferenceKey, boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  // Show the copy from the profile instantly, then refresh from the server
  const preferences = withNotificationDefaults(storedPreferences ?? profilePreferences);
  const hasLoaded = storedPreferences !== null || profilePreferences !== undefined;
  const allChannelsOff = NOTIFICATION_CHANNEL_KEYS.every((key) => !preferences[key]);

  useEffect(() => {
    fetchNotificationPreferences().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load notification preferences');
    });
  }, [fetchNotificationPreferences]);

  const handleToggle = async (key: NotificationPreferenceKey, value: boolean) => {
    setError(null);
    setPendingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
    } finally {
      setPendingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerSpacer}>
          {loading && hasLoaded ? <ActivityIndicator size="small" color={c.muted} /> : null}
        </View>
      </View>

      {!hasLoaded && loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error ? (
            <View style={styles.banner}>
              <Ionicons name="alert-circle-outline" size={18} color={c.primary} />
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}

          {allChannelsOff ? (
            <View style={[styles.banner, styles.warningBanner]}>
              <Ionicons name="notifications-off-outline" size={18} color="#F59E0B" />
              <Text style={styles.bannerText}>
                All channels are off, so you won't receive any alerts — including new orders.
              </Text>
            </View>
          ) : null}

          {NOTIFICATION_PREFERENCE_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>

              <View style={styles.card}>
                {section.rows.map((row, index) => (
                  <View
                    key={row.key}
                    style={[styles.row, index < section.rows.length - 1 && styles.rowDivider]}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        { backgroundColor: tintBg('#3B82F6', '#DBEAFE', isDark) },
                      ]}
                    >
                      <Ionicons name={row.icon} size={18} color="#3B82F6" />
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowHint}>{row.hint}</Text>
                    </View>
                    <Switch
                      value={preferences[row.key]}
                      onValueChange={(value) => handleToggle(row.key, value)}
                      disabled={pendingKeys[row.key]}
                      trackColor={{ false: c.border, true: c.brand }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel={row.label}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.footnote}>Changes are saved automatically.</Text>
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSpacer: {
      width: 24,
      alignItems: 'flex-end',
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 18,
      color: c.text,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.card,
    },
    warningBanner: {
      borderColor: '#F59E0B',
    },
    bannerText: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.text,
    },
    sectionDescription: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
      marginBottom: 10,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowInfo: {
      flex: 1,
    },
    rowLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    rowHint: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
    },
    footnote: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
    },
  });
}
