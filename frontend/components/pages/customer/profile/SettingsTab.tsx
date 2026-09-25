import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ListRow from './ListRow';
import LanguageSheet from './LanguageSheet';
import NotificationSettingsSheet from './NotificationSettingsSheet';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { useAppThemeStore } from '@/stores/appThemeStore';
import { CUSTOMER_LANGUAGES } from '@/constants/customerStrings';
import { useCustomerPreferencesStore, useCustomerT } from '@/stores/customerPreferencesStore';

interface SettingsTabProps {
  user: { email: string } | null;
  onLogout: () => void;
}

export default function SettingsTab({ user, onLogout }: SettingsTabProps) {
  const { Colors, sharedStyles } = useCustomerProfileStyles();
  const isDark = useAppThemeStore((s) => s.isDark);
  const setIsDark = useAppThemeStore((s) => s.setIsDark);
  const t = useCustomerT();
  const language = useCustomerPreferencesStore((s) => s.language);
  const pushOn = useCustomerPreferencesStore((s) => s.notifications.push);
  const loadPreferences = useCustomerPreferencesStore((s) => s.load);
  const [sheet, setSheet] = useState<'language' | 'notifications' | null>(null);

  useEffect(() => {
    loadPreferences().catch(() => {}); // Cached copy is fine offline
  }, [loadPreferences]);

  const languageLabel = CUSTOMER_LANGUAGES.find((l) => l.code === language)?.nativeLabel ?? 'English';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionLabel: {
          fontSize: 11,
          fontWeight: '700',
          color: Colors.primary,
          letterSpacing: 1.4,
          marginBottom: 10,
          marginLeft: 4,
        },
        settingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        settingValue: { fontSize: 13, color: Colors.textSecondary },
        versionText: { fontSize: 13, color: Colors.textMuted },
        darkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: 18,
        },
        darkLabelWrap: { flex: 1, paddingRight: 12 },
        darkTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
        darkSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
        logoutBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.brand,
          borderRadius: 14,
          paddingVertical: 16,
          gap: 10,
          marginTop: 28,
          shadowColor: Colors.primary,
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        logoutText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
        loggedInAs: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 12 },
      }),
    [Colors],
  );

  return (
    <>
      <ScrollView
        style={sharedStyles.tabContent}
        contentContainerStyle={sharedStyles.tabContentInner}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('preferences')}</Text>
        <View style={sharedStyles.listCard}>
          <View style={styles.darkRow}>
            <View style={styles.darkLabelWrap}>
              <Text style={styles.darkTitle}>{t('darkMode')}</Text>
              <Text style={styles.darkSub}>{t('darkModeHint')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setIsDark}
              trackColor={{ false: Colors.border, true: Colors.brand }}
              thumbColor="#FFFFFF"
              accessibilityLabel={t('darkMode')}
            />
          </View>
          <View style={sharedStyles.divider} />
          <ListRow
            icon={
              <Ionicons name="notifications-outline" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
            }
            label={t('notificationSettings')}
            onPress={() => setSheet('notifications')}
            rightElement={
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>
                  {pushOn ? t('notificationSettingsHintOn') : t('notificationSettingsHintOff')}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            }
          />
          <View style={sharedStyles.divider} />
          <ListRow
            icon={
              <Ionicons name="globe-outline" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
            }
            label={t('language')}
            onPress={() => setSheet('language')}
            rightElement={
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>{languageLabel}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            }
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('legalAbout')}</Text>
        <View style={sharedStyles.listCard}>
          <ListRow
            label={t('privacyPolicy')}
            onPress={() => Linking.openURL('https://example.com/privacy')}
            rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
          />
          <View style={sharedStyles.divider} />
          <ListRow
            label={t('termsOfService')}
            onPress={() => Linking.openURL('https://example.com/terms')}
            rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
          />
          <View style={sharedStyles.divider} />
          <ListRow label={t('appVersion')} rightElement={<Text style={styles.versionText}>v4.12.0 (Build 892)</Text>} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>{t('logOut')}</Text>
        </TouchableOpacity>

        {user?.email && <Text style={styles.loggedInAs}>{t('loggedInAs', { email: user.email })}</Text>}
      </ScrollView>

      <Modal
        visible={sheet !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSheet(null)}
      >
        {sheet === 'language' ? (
          <LanguageSheet onClose={() => setSheet(null)} />
        ) : sheet === 'notifications' ? (
          <NotificationSettingsSheet onClose={() => setSheet(null)} />
        ) : null}
      </Modal>
    </>
  );
}
