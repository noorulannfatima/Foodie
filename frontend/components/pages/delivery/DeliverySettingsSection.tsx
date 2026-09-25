import { useMemo, useState, type ReactNode } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { DELIVERY_LANGUAGE_LABELS, deliveryProfileT } from '@/constants/deliveryProfileStrings';
import { Switch } from '@/components/atoms';
import type { DeliveryLanguage } from '@/stores/deliveryPreferencesStore';
import DeliveryLanguageSheet from './DeliveryLanguageSheet';

export interface DeliverySettingsSectionProps {
  language: DeliveryLanguage;
  darkMode: boolean;
  notificationsEnabled: boolean;
  appVersion?: string;
  onDarkModeChange: (value: boolean) => void;
  onNotificationsChange: (value: boolean) => void;
  onLanguageChange: (code: DeliveryLanguage) => Promise<void>;
  onLogout: () => void;
}

/**
 * Settings tab body for the delivery profile. Same anatomy as the customer settings:
 * a section label over one grouped card of icon rows, language in its own sheet.
 */
export default function DeliverySettingsSection({
  language,
  darkMode,
  notificationsEnabled,
  appVersion,
  onDarkModeChange,
  onNotificationsChange,
  onLanguageChange,
  onLogout,
}: DeliverySettingsSectionProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [languageOpen, setLanguageOpen] = useState(false);
  const t = (key: Parameters<typeof deliveryProfileT>[1]) => deliveryProfileT(language, key);

  return (
    <>
      <Text style={styles.sectionLabel}>{t('preferences')}</Text>
      <View style={styles.card}>
        <Row
          styles={styles}
          c={c}
          icon="moon-outline"
          label={t('darkMode')}
          hint={t('darkModeHint')}
          right={<Switch value={darkMode} onValueChange={onDarkModeChange} />}
        />
        <View style={styles.divider} />
        <Row
          styles={styles}
          c={c}
          icon="notifications-outline"
          label={t('notifications')}
          hint={t('notificationsHint')}
          right={<Switch value={notificationsEnabled} onValueChange={onNotificationsChange} />}
        />
        <View style={styles.divider} />
        <Row
          styles={styles}
          c={c}
          icon="globe-outline"
          label={t('language')}
          onPress={() => setLanguageOpen(true)}
          right={
            <View style={styles.valueRow}>
              <Text style={styles.value}>{DELIVERY_LANGUAGE_LABELS[language]}</Text>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </View>
          }
        />
      </View>

      <Text style={[styles.sectionLabel, styles.sectionGap]}>{t('about')}</Text>
      <View style={styles.card}>
        <Row
          styles={styles}
          c={c}
          icon="information-circle-outline"
          label={t('version')}
          right={<Text style={styles.value}>{appVersion ?? '—'}</Text>}
        />
      </View>

      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
      >
        <Ionicons name="log-out-outline" size={20} color={c.primary} />
        <Text style={styles.logoutText}>{t('logOut')}</Text>
      </Pressable>

      <Modal
        visible={languageOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <DeliveryLanguageSheet
          language={language}
          onChoose={onLanguageChange}
          onClose={() => setLanguageOpen(false)}
        />
      </Modal>
    </>
  );
}

function Row({
  styles,
  c,
  icon,
  label,
  hint,
  right,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint?: string;
  right: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Ionicons name={icon} size={22} color={c.text} style={styles.rowIcon} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sectionLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.primary,
      letterSpacing: 1.4,
      marginBottom: 10,
      marginLeft: 4,
    },
    sectionGap: { marginTop: 24 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      paddingVertical: 12,
      paddingHorizontal: 18,
      gap: 12,
    },
    rowIcon: { marginRight: 2 },
    rowText: { flex: 1 },
    rowLabel: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    rowHint: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 2 },
    divider: { height: 1, backgroundColor: c.border, marginHorizontal: 18 },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    value: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted },
    logout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      marginTop: 28,
    },
    logoutText: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.primary },
    pressed: { opacity: 0.7 },
  });
}
