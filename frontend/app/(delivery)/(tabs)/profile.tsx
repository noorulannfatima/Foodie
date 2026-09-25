import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { Loader } from '@/components/atoms';
import {
  DeliveryPageHeading,
  DeliverySegmentedTabs,
  DeliverySettingsSection,
} from '@/components/pages/delivery';
import { deliveryProfileT } from '@/constants/deliveryProfileStrings';
import { deliveryAPI, type DeliveryProfile } from '@/services/api/delivery.api';
import { useAuthStore } from '@/stores/authStore';
import {
  useDeliveryPreferencesStore,
  type DeliveryLanguage,
} from '@/stores/deliveryPreferencesStore';
import { useAppThemeStore } from '@/stores/appThemeStore';

const VEHICLE_TYPES = ['Bicycle', 'Bike', 'Scooter', 'Car'] as const;
type TabId = 'account' | 'settings';

function localeForLang(lang: DeliveryLanguage): string {
  if (lang === 'ur') return 'ur-PK';
  if (lang === 'fr') return 'fr-FR';
  if (lang === 'es') return 'es-ES';
  return 'en-US';
}

export default function DeliveryProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const darkMode = useAppThemeStore((s) => s.isDark);
  const storeLang = useDeliveryPreferencesStore((s) => s.language);
  const mergePrefs = useDeliveryPreferencesStore((s) => s.mergeFromServer);

  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const styles = useMemo(() => createProfileStyles(c), [c]);
  const t = useCallback(
    (key: Parameters<typeof deliveryProfileT>[1]) => deliveryProfileT(storeLang, key),
    [storeLang],
  );

  const [tab, setTab] = useState<TabId>('account');
  const [p, setP] = useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fImage, setFImage] = useState('');
  const [fVType, setFVType] = useState<string>('Bicycle');
  const [fPlate, setFPlate] = useState('');
  const [fVModel, setFVModel] = useState('');
  const [fVColor, setFVColor] = useState('');
  const [fLicense, setFLicense] = useState('');
  const [fLicenseExp, setFLicenseExp] = useState('');
  const [fEcName, setFEcName] = useState('');
  const [fEcPhone, setFEcPhone] = useState('');
  const [fEcRel, setFEcRel] = useState('');
  const [fCurPw, setFCurPw] = useState('');
  const [fNewPw, setFNewPw] = useState('');
  const [fConfPw, setFConfPw] = useState('');

  const openEdit = () => {
    if (!p) return;
    setFName(p.name);
    setFEmail(p.email);
    setFPhone(p.phone);
    setFImage(p.profileImage ?? '');
    setFVType(p.vehicle?.type ?? 'Bicycle');
    setFPlate(p.vehicle?.plateNumber ?? '');
    setFVModel(p.vehicle?.model ?? '');
    setFVColor(p.vehicle?.color ?? '');
    setFLicense(p.licenseNumber ?? '');
    setFLicenseExp(
      p.licenseExpiry ? new Date(p.licenseExpiry).toISOString().slice(0, 10) : '',
    );
    setFEcName(p.emergencyContact?.name ?? '');
    setFEcPhone(p.emergencyContact?.phone ?? '');
    setFEcRel(p.emergencyContact?.relation ?? '');
    setFCurPw('');
    setFNewPw('');
    setFConfPw('');
    setEditOpen(true);
  };

  const load = useCallback(async () => {
    try {
      const { profile } = await deliveryAPI.getMe();
      setP(profile);
      mergePrefs(
        profile.preferences ?? {
          darkMode: false,
          notificationsEnabled: true,
          language: 'en',
        },
      );
    } catch {
      setP(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mergePrefs]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/delivery/login');
  };

  const onSaveProfile = async () => {
    if (!p) return;
    const pwPartial = Boolean(fCurPw || fNewPw || fConfPw);
    if (pwPartial) {
      if (!fCurPw || !fNewPw || !fConfPw) {
        Alert.alert(t('changePassword'), 'Fill current, new, and confirm password');
        return;
      }
      if (fNewPw !== fConfPw) {
        Alert.alert(t('changePassword'), 'New passwords do not match');
        return;
      }
      if (fNewPw.length < 8) {
        Alert.alert(t('changePassword'), 'New password must be at least 8 characters');
        return;
      }
    }
    setSaveBusy(true);
    try {
      const body: Parameters<typeof deliveryAPI.patchProfile>[0] = {
        name: fName.trim(),
        email: fEmail.trim().toLowerCase(),
        phone: fPhone.trim(),
        profileImage: fImage.trim() || null,
        vehicle: {
          type: fVType,
          plateNumber: fPlate.trim(),
          model: fVModel.trim() || undefined,
          color: fVColor.trim() || undefined,
        },
        licenseNumber: fLicense.trim(),
        licenseExpiry: fLicenseExp.trim() || null,
        emergencyContact:
          fEcName.trim() || fEcPhone.trim()
            ? {
                name: fEcName.trim(),
                phone: fEcPhone.trim(),
                relation: fEcRel.trim(),
              }
            : null,
      };
      if (fCurPw && fNewPw) {
        body.passwordUpdate = { current: fCurPw, next: fNewPw };
      }
      const { profile } = await deliveryAPI.patchProfile(body);
      setP(profile);
      mergePrefs(
        profile.preferences ?? {
          darkMode: false,
          notificationsEnabled: true,
          language: 'en',
        },
      );
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.setState({
          user: { ...authUser, name: profile.name, email: profile.email },
        });
      }
      setEditOpen(false);
    } catch (e) {
      Alert.alert(t('updateAccount'), e instanceof Error ? e.message : 'Error');
    } finally {
      setSaveBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert(t('password'), 'Required');
      return;
    }
    setDeleteBusy(true);
    try {
      await deliveryAPI.deleteAccount(deletePassword);
      setDeleteOpen(false);
      setDeletePassword('');
      await logout();
      router.replace('/(auth)/delivery/login');
    } catch (e) {
      Alert.alert(t('deleteAccount'), e instanceof Error ? e.message : 'Error');
    } finally {
      setDeleteBusy(false);
    }
  };

  const patchPref = async (
    patch: Partial<{ darkMode: boolean; notificationsEnabled: boolean; language: DeliveryLanguage }>,
  ) => {
    const prev = useDeliveryPreferencesStore.getState();
    mergePrefs({
      darkMode: patch.darkMode ?? prev.darkMode,
      notificationsEnabled: patch.notificationsEnabled ?? prev.notificationsEnabled,
      language: patch.language ?? prev.language,
    });
    try {
      const { preferences } = await deliveryAPI.patchPreferences(patch);
      mergePrefs(preferences);
    } catch (e) {
      mergePrefs({
        darkMode: prev.darkMode,
        notificationsEnabled: prev.notificationsEnabled,
        language: prev.language,
      });
      Alert.alert(t('settings'), e instanceof Error ? e.message : 'Error');
    }
  };

  const notif = useDeliveryPreferencesStore((s) => s.notificationsEnabled);
  const locale = localeForLang(storeLang);

  const inputProps = {
    placeholderTextColor: c.muted,
    style: styles.input,
  };

  if (loading && !p) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  const appVersion = Constants.expoConfig?.version;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <DeliveryPageHeading title={t('profileTitle')} />

        <View style={styles.tabsWrap}>
          <DeliverySegmentedTabs<TabId>
            tabs={[
              { key: 'account', label: t('account') },
              { key: 'settings', label: t('settings') },
            ]}
            active={tab}
            onChange={setTab}
          />
        </View>

        {tab === 'account' ? (
          <>
            <Section title={t('personalInfo')} icon="person-outline" sx={styles} c={c}>
              <Row label={t('name')} value={p?.name ?? '—'} sx={styles} />
              <Row label={t('email')} value={p?.email ?? '—'} sx={styles} />
              <Row label={t('phone')} value={p?.phone ?? '—'} sx={styles} last />
            </Section>

            <Section title={t('vehicleInfo')} icon="bicycle-outline" sx={styles} c={c}>
              <Row
                label={t('vehicleType')}
                value={
                  p?.vehicle?.model ? `${p.vehicle.model} (${p.vehicle.type})` : p?.vehicle?.type ?? '—'
                }
                sx={styles}
              />
              <Row label={t('plate')} value={p?.vehicle?.plateNumber ?? '—'} sx={styles} last={!p?.vehicle?.color} />
              {p?.vehicle?.color ? (
                <Row label={t('vehicleColor')} value={p.vehicle.color} sx={styles} last />
              ) : null}
            </Section>

            <Section title={t('documents')} icon="folder-outline" sx={styles} c={c}>
              <Pressable
                style={({ pressed }) => [styles.docRow, pressed && { opacity: 0.7 }]}
                onPress={() => Alert.alert(t('driversLicense'), t('verifiedOnFile'))}
                accessibilityRole="button"
              >
                <Ionicons name="card-outline" size={20} color={c.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('driversLicense')}</Text>
                  <Text style={styles.docSub}>
                    {p?.licenseExpiry
                      ? `${t('expires')} ${new Date(p.licenseExpiry).toLocaleString(locale, { month: 'short', year: 'numeric' })}`
                      : t('verifiedOnFile')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              </Pressable>
              {p?.emergencyContact?.name ? (
                <View style={[styles.docRow, styles.docRowLast]}>
                  <Ionicons name="people-outline" size={20} color={c.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{t('emergencyContact')}</Text>
                    <Text style={styles.docSub}>
                      {[p.emergencyContact.name, p.emergencyContact.phone].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Section>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={openEdit}
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>{t('updateAccount')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.dangerOutline, pressed && { opacity: 0.7 }]}
              onPress={() => setDeleteOpen(true)}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={c.primary} />
              <Text style={styles.dangerOutlineText}>{t('deleteAccount')}</Text>
            </Pressable>
          </>
        ) : (
          <DeliverySettingsSection
            language={storeLang}
            darkMode={darkMode}
            notificationsEnabled={notif}
            appVersion={appVersion}
            onDarkModeChange={(v) => patchPref({ darkMode: v })}
            onNotificationsChange={(v) => patchPref({ notificationsEnabled: v })}
            onLanguageChange={(code) => patchPref({ language: code })}
            onLogout={onLogout}
          />
        )}
      </ScrollView>

      <Modal visible={editOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('updateAccount')}</Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Text style={styles.fieldLbl}>{t('name')}</Text>
              <TextInput {...inputProps} value={fName} onChangeText={setFName} />

              <Text style={styles.fieldLbl}>{t('email')}</Text>
              <TextInput
                {...inputProps}
                value={fEmail}
                onChangeText={setFEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLbl}>{t('phone')}</Text>
              <TextInput {...inputProps} value={fPhone} onChangeText={setFPhone} keyboardType="phone-pad" />

              <Text style={styles.fieldLbl}>{t('profilePhotoUrl')}</Text>
              <TextInput {...inputProps} value={fImage} onChangeText={setFImage} autoCapitalize="none" />

              <Text style={styles.fieldLbl}>{t('vehicleType')}</Text>
              <View style={styles.vehPickRow}>
                {VEHICLE_TYPES.map((vt) => (
                  <Pressable
                    key={vt}
                    style={[styles.vehChip, fVType === vt && styles.vehChipOn]}
                    onPress={() => setFVType(vt)}
                  >
                    <Text style={[styles.vehChipTx, fVType === vt && styles.vehChipTxOn]}>{vt}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLbl}>{t('plate')}</Text>
              <TextInput {...inputProps} value={fPlate} onChangeText={setFPlate} autoCapitalize="characters" />

              <Text style={styles.fieldLbl}>{t('vehicleModel')}</Text>
              <TextInput {...inputProps} value={fVModel} onChangeText={setFVModel} />

              <Text style={styles.fieldLbl}>{t('vehicleColor')}</Text>
              <TextInput {...inputProps} value={fVColor} onChangeText={setFVColor} />

              <Text style={styles.fieldLbl}>{t('licenseNumber')}</Text>
              <TextInput {...inputProps} value={fLicense} onChangeText={setFLicense} autoCapitalize="characters" />

              <Text style={styles.fieldLbl}>{t('licenseExpiry')}</Text>
              <TextInput {...inputProps} value={fLicenseExp} onChangeText={setFLicenseExp} placeholder="YYYY-MM-DD" />

              <Text style={[styles.fieldLbl, { marginTop: 8 }]}>{t('emergencyContact')}</Text>
              <TextInput {...inputProps} value={fEcName} onChangeText={setFEcName} placeholder={t('ecName')} />
              <TextInput {...inputProps} value={fEcPhone} onChangeText={setFEcPhone} placeholder={t('ecPhone')} keyboardType="phone-pad" />
              <TextInput {...inputProps} value={fEcRel} onChangeText={setFEcRel} placeholder={t('ecRelation')} />

              <Text style={[styles.fieldLbl, { marginTop: 12 }]}>{t('changePassword')}</Text>
              <TextInput
                {...inputProps}
                value={fCurPw}
                onChangeText={setFCurPw}
                placeholder={t('currentPassword')}
                secureTextEntry
              />
              <TextInput
                {...inputProps}
                value={fNewPw}
                onChangeText={setFNewPw}
                placeholder={t('newPassword')}
                secureTextEntry
              />
              <TextInput
                {...inputProps}
                value={fConfPw}
                onChangeText={setFConfPw}
                placeholder={t('confirmPassword')}
                secureTextEntry
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalGhostTxt}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, saveBusy && { opacity: 0.8 }]}
                onPress={onSaveProfile}
                disabled={saveBusy}
              >
                {saveBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryTxt}>{t('save')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={deleteOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteTitle}>{t('deleteConfirmTitle')}</Text>
            <Text style={styles.deleteMsg}>{t('deleteConfirmMessage')}</Text>
            <Text style={styles.fieldLbl}>{t('password')}</Text>
            <TextInput
              placeholderTextColor={c.muted}
              style={styles.input}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalGhost} onPress={() => setDeleteOpen(false)}>
                <Text style={styles.modalGhostTxt}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDanger, deleteBusy && { opacity: 0.8 }]}
                onPress={onDeleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryTxt}>{t('closeAccount')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


function Section({
  title,
  icon,
  children,
  sx,
  c,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  sx: ReturnType<typeof createProfileStyles>;
  c: AppColors;
}) {
  return (
    <View style={sx.section}>
      <View style={sx.sectionHead}>
        <Ionicons name={icon} size={18} color={c.primary} />
        <Text style={sx.groupTitle}>{title.toUpperCase()}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  sx,
  last,
}: {
  label: string;
  value: string;
  sx: ReturnType<typeof createProfileStyles>;
  last?: boolean;
}) {
  return (
    <View style={[sx.row, last && sx.rowLast]}>
      <Text style={sx.rowLabel}>{label}</Text>
      <Text style={sx.rowVal} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function createProfileStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.screenBackground },
    content: { padding: 20, paddingBottom: 40 },
    tabsWrap: { marginTop: -8, marginBottom: 16 },
    section: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      marginBottom: 16,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    groupTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
      letterSpacing: 1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    rowLabel: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted },
    rowVal: { flexShrink: 1, fontFamily: Fonts.brandBold, fontSize: 14, color: c.text, textAlign: 'right' },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    docRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    docTitle: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.text },
    docSub: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 2 },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.brand,
      minHeight: 48,
      borderRadius: 12,
      marginBottom: 10,
    },
    primaryBtnText: { fontFamily: Fonts.brandBold, color: '#fff', fontSize: 15 },
    dangerOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    dangerOutlineText: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.primary },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      maxHeight: '92%',
    },
    modalTitle: { fontFamily: Fonts.brandBlack, fontSize: 20, color: c.text, marginBottom: 8 },
    fieldLbl: {
      fontFamily: Fonts.brandBold,
      fontSize: 12,
      color: c.muted,
      marginTop: 12,
      marginBottom: 6,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    input: {
      fontFamily: Fonts.brand,
      backgroundColor: c.screenBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 15,
      color: c.text,
      marginBottom: 6,
    },
    vehPickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vehChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    vehChipOn: { backgroundColor: c.text, borderColor: c.text },
    vehChipTx: { fontFamily: Fonts.brandBold, fontSize: 13, color: c.muted },
    vehChipTxOn: { color: c.background },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 24 },
    modalGhost: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalGhostTxt: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    modalPrimary: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: c.brand,
    },
    modalPrimaryTxt: { fontFamily: Fonts.brandBold, fontSize: 15, color: '#fff' },
    modalDanger: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: c.brand,
    },
    deleteSheet: {
      alignSelf: 'center',
      marginTop: 'auto',
      marginBottom: 'auto',
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      width: '88%',
      maxWidth: 400,
    },
    deleteTitle: { fontFamily: Fonts.brandBlack, fontSize: 20, color: c.text, marginBottom: 8 },
    deleteMsg: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted, lineHeight: 20, marginBottom: 4 },
  });
}
