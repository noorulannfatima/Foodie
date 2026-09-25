import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { BRAND_RED_TINT, Fonts, tintBg, useAppThemeColors, type AppColors } from '@/constants/theme';
import { DELIVERY_LANGUAGE_LABELS } from '@/constants/deliveryProfileStrings';
import { adminT } from '@/constants/adminStrings';
import { Switch } from '@/components/atoms';
import { useAuthStore } from '@/stores/authStore';
import { useAppThemeStore } from '@/stores/appThemeStore';
import { useAppLanguageStore, type AppLanguage } from '@/stores/appLanguageStore';

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isDark = useAppThemeStore((s) => s.isDark);
  const setIsDark = useAppThemeStore((s) => s.setIsDark);
  const language = useAppLanguageStore((s) => s.language);
  const setLanguage = useAppLanguageStore((s) => s.setLanguage);
  const t = (key: Parameters<typeof adminT>[1]) => adminT(language, key);

  const appVersion = Constants.expoConfig?.version;
  const initial = (user?.name ?? 'A').trim().charAt(0).toUpperCase();

  const confirmSignOut = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">
          {t('settingsTitle')}
        </Text>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.accountBody}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name ?? 'Admin'}
            </Text>
            {user?.email ? (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{t('administrator')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{t('appearance')}</Text>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.setLabel}>{t('darkMode')}</Text>
              <Text style={styles.setHint}>{t('darkModeHint')}</Text>
            </View>
            <Switch value={isDark} onValueChange={setIsDark} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.groupTitle}>{t('language')}</Text>
          <Text style={[styles.setHint, styles.hintGap]}>{t('languageHint')}</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup">
            {(Object.keys(DELIVERY_LANGUAGE_LABELS) as AppLanguage[]).map((code) => {
              const on = language === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLanguage(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {DELIVERY_LANGUAGE_LABELS[code]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={c.primary} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </Pressable>

        {appVersion ? (
          <Text style={styles.version}>
            {t('version')} {appVersion}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.screenBackground },
    content: { padding: 20, paddingBottom: 40 },
    flex: { flex: 1 },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
      marginBottom: 20,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginBottom: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.brand,
    },
    avatarText: { fontFamily: Fonts.brandBlack, fontSize: 20, color: '#fff' },
    accountBody: { flex: 1 },
    name: { fontFamily: Fonts.brandBold, fontSize: 16, color: c.text },
    email: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, marginTop: 2 },
    roleBadge: {
      backgroundColor: tintBg(c.brand, BRAND_RED_TINT, c.isDark),
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: { fontFamily: Fonts.brandBold, fontSize: 11, color: c.primary, letterSpacing: 0.5 },
    section: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginBottom: 16,
    },
    groupTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 12,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    setLabel: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    setHint: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, marginTop: 2 },
    hintGap: { marginTop: -6, marginBottom: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    // Fixed height so the Urdu fallback font doesn't make its chip taller than the rest
    chip: {
      height: 36,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipOn: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontFamily: Fonts.brandBold, fontSize: 13, color: c.muted },
    chipTextOn: { color: c.background },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
      marginTop: 8,
    },
    signOutText: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.primary },
    pressed: { opacity: 0.7 },
    version: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      marginTop: 14,
    },
  });
}
