import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { DeliveryColors, DeliveryLayout, getDeliveryTabTheme } from '@/constants/deliveryTheme';
import {
  DELIVERY_LANGUAGE_LABELS,
  deliveryProfileT,
} from '@/constants/deliveryProfileStrings';
import { deliveryAPI, type DeliveryProfile } from '@/services/api/delivery.api';
import { useAuthStore } from '@/stores/authStore';
import {
  useDeliveryPreferencesStore,
  type DeliveryLanguage,
} from '@/stores/deliveryPreferencesStore';
import { useAppThemeStore } from '@/stores/appThemeStore';

const VEHICLE_TYPES = ['Bicycle', 'Bike', 'Scooter', 'Car'] as const;
type TabId = 'account' | 'settings';

function formatSince(iso: string | undefined, locale: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(locale, { month: 'short', year: 'numeric' });
}

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

  const theme = useMemo(() => getDeliveryTabTheme(darkMode), [darkMode]);
  const styles = useMemo(() => createProfileStyles(theme), [theme]);
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
  const rating = p?.stats?.averageRating?.toFixed(2) ?? '—';
  const reliability = `${p?.completionRate ?? 0}%`;
  const locale = localeForLang(storeLang);

  const inputProps = {
    placeholderTextColor: theme.textMuted,
    style: styles.input,
  };

  return (
    <View style={styles.root}>
      <DeliveryHeader avatarUri={p?.profileImage ?? undefined} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={DeliveryColors.red}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>{t('profileTitle')}</Text>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === 'account' && styles.tabActive]}
            onPress={() => setTab('account')}
          >
            <Text style={[styles.tabText, tab === 'account' && styles.tabTextActive]}>
              {t('account')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'settings' && styles.tabActive]}
            onPress={() => setTab('settings')}
          >
            <Text style={[styles.tabText, tab === 'settings' && styles.tabTextActive]}>
              {t('settings')}
            </Text>
          </Pressable>
        </View>

        {tab === 'account' ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.accentBar} />
              <View style={styles.heroInner}>
                <View style={styles.avatarBlock}>
                  {p?.profileImage ? (
                    <Image source={{ uri: p.profileImage }} style={styles.bigAvatar} />
                  ) : (
                    <View style={[styles.bigAvatar, styles.avatarPh]}>
                      <Ionicons name="person" size={48} color={theme.navy} />
                    </View>
                  )}
                  <Pressable style={styles.editFab} onPress={openEdit}>
                    <Ionicons name="pencil" size={16} color={DeliveryColors.white} />
                  </Pressable>
                </View>
                <Text style={styles.name}>{loading ? '…' : p?.name}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.tierPill}>
                    <Text style={styles.tierText}>{p?.tierLabel ?? 'MESSENGER TIER'}</Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.rateNum}>{rating}</Text>
                  </View>
                </View>
                <View style={styles.stats3}>
                  <View style={styles.statCol}>
                    <Text style={styles.statN}>{p?.stats?.totalDeliveries ?? '—'}</Text>
                    <Text style={styles.statL}>{t('totalOrders')}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statN}>{formatSince(p?.createdAt, locale)}</Text>
                    <Text style={styles.statL}>{t('memberSince')}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statN}>{reliability}</Text>
                    <Text style={styles.statL}>{t('reliability')}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Pressable style={styles.primaryBtn} onPress={openEdit}>
              <Ionicons name="create-outline" size={20} color={DeliveryColors.white} />
              <Text style={styles.primaryBtnText}>{t('updateAccount')}</Text>
            </Pressable>

            <Section title={t('personalInfo')} icon="person-outline" sx={styles}>
              <Row label={t('email')} value={p?.email ?? '—'} sx={styles} />
              <Row label={t('phone')} value={p?.phone ?? '—'} sx={styles} />
              <Row label={t('name')} value={p?.name ?? '—'} sx={styles} />
            </Section>

            <Section title={t('vehicleInfo')} icon="bicycle-outline" sx={styles}>
              <View style={styles.vehBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehTag}>{t('vehicleType').toUpperCase()}</Text>
                  <Text style={styles.vehName}>
                    {p?.vehicle?.model
                      ? `${p.vehicle.model} (${p.vehicle.type})`
                      : p?.vehicle?.type ?? '—'}
                  </Text>
                  <Text style={styles.vehLic}>
                    {t('plate')}: {p?.vehicle?.plateNumber ?? '—'}
                  </Text>
                </View>
                <View style={styles.vehThumb}>
                  <Ionicons name="bicycle" size={36} color={theme.navy} />
                </View>
              </View>
            </Section>

            <Section title={t('documents')} icon="folder-outline" sx={styles}>
              <Pressable
                style={styles.docBox}
                onPress={() => Alert.alert(t('driversLicense'), t('verifiedOnFile'))}
              >
                <Ionicons name="card-outline" size={22} color={theme.navy} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{t('driversLicense')}</Text>
                  <Text style={styles.docSub}>
                    {p?.licenseExpiry
                      ? `${t('expires')} ${new Date(p.licenseExpiry).toLocaleString(locale, { month: 'short', year: 'numeric' })}`
                      : t('verifiedOnFile')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
              {p?.emergencyContact?.name ? (
                <View style={[styles.docBox, { marginBottom: 0 }]}>
                  <Ionicons name="people-outline" size={22} color={theme.navy} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{t('emergencyContact')}</Text>
                    <Text style={styles.docSub}>
                      {p.emergencyContact.name} • {p.emergencyContact.phone ?? ''}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Section>

            <Pressable style={styles.dangerOutline} onPress={() => setDeleteOpen(true)}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={styles.dangerOutlineText}>{t('deleteAccount')}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionGroupTitle}>{t('appearance')}</Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.setLabel}>{t('darkMode')}</Text>
                  <Text style={styles.setHint}>{t('darkModeHint')}</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={(v) => patchPref({ darkMode: v })}
                  trackColor={{ false: theme.border, true: '#FCA5A5' }}
                  thumbColor={darkMode ? DeliveryColors.red : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionGroupTitle}>{t('general')}</Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.setLabel}>{t('notifications')}</Text>
                  <Text style={styles.setHint}>{t('notificationsHint')}</Text>
                </View>
                <Switch
                  value={notif}
                  onValueChange={(v) => patchPref({ notificationsEnabled: v })}
                  trackColor={{ false: theme.border, true: '#FCA5A5' }}
                  thumbColor={notif ? DeliveryColors.red : '#f4f3f4'}
                />
              </View>
              <Text style={[styles.setLabel, { marginTop: 16, marginBottom: 10 }]}>
                {t('language')}
              </Text>
              <View style={styles.langRow}>
                {(Object.keys(DELIVERY_LANGUAGE_LABELS) as DeliveryLanguage[]).map((code) => (
                  <Pressable
                    key={code}
                    style={[styles.langChip, storeLang === code && styles.langChipActive]}
                    onPress={() => patchPref({ language: code })}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        storeLang === code && styles.langChipTextActive,
                      ]}
                    >
                      {DELIVERY_LANGUAGE_LABELS[code]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={22} color={DeliveryColors.red} />
          <Text style={styles.logoutText}>{t('logOut')}</Text>
        </Pressable>
        <Text style={styles.ver}>
          {t('appVersion')} 4.2.1-MESSENGER
        </Text>
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
                  <ActivityIndicator color={DeliveryColors.white} />
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
              placeholderTextColor={theme.textMuted}
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
                  <ActivityIndicator color={DeliveryColors.white} />
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
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  sx: ReturnType<typeof createProfileStyles>;
}) {
  return (
    <View style={sx.section}>
      <View style={sx.sectionHead}>
        <View style={sx.sectionTitleRow}>
          <Ionicons name={icon} size={20} color={DeliveryColors.red} />
          <Text style={sx.sectionTitle}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  sx,
}: {
  label: string;
  value: string;
  sx: ReturnType<typeof createProfileStyles>;
}) {
  return (
    <View style={sx.row}>
      <Text style={sx.rowLabel}>{label}</Text>
      <Text style={sx.rowVal}>{value}</Text>
    </View>
  );
}

function createProfileStyles(theme: ReturnType<typeof getDeliveryTabTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.pageBg },
    content: { paddingHorizontal: DeliveryLayout.screenPaddingH, paddingBottom: 40 },
    screenTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.navy,
      marginTop: 4,
      marginBottom: 12,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.sky,
      alignItems: 'center',
    },
    tabActive: { backgroundColor: theme.card, borderWidth: 2, borderColor: DeliveryColors.red },
    tabText: { fontSize: 14, fontWeight: '700', color: theme.textMuted },
    tabTextActive: { color: DeliveryColors.red },
    heroCard: {
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      overflow: 'hidden',
      marginBottom: 14,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOpacity: theme.isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    accentBar: { width: 4, backgroundColor: DeliveryColors.red },
    heroInner: { flex: 1, padding: 16 },
    avatarBlock: { alignSelf: 'center', marginBottom: 8 },
    bigAvatar: { width: 96, height: 96, borderRadius: 48 },
    avatarPh: { backgroundColor: theme.sky, alignItems: 'center', justifyContent: 'center' },
    editFab: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      backgroundColor: DeliveryColors.red,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: theme.card,
    },
    name: { fontSize: 22, fontWeight: '800', color: theme.text, textAlign: 'center' },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 8,
    },
    tierPill: {
      backgroundColor: '#EA580C',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    tierText: { color: DeliveryColors.white, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rateNum: { fontSize: 16, fontWeight: '800', color: '#F59E0B' },
    stats3: {
      flexDirection: 'row',
      marginTop: 18,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 14,
    },
    statCol: { flex: 1, alignItems: 'center' },
    statN: { fontSize: 15, fontWeight: '800', color: theme.navy },
    statL: { fontSize: 11, color: theme.textMuted, marginTop: 4, textAlign: 'center' },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: DeliveryColors.red,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 14,
    },
    primaryBtnText: { color: DeliveryColors.white, fontSize: 15, fontWeight: '800' },
    section: {
      backgroundColor: theme.card,
      borderRadius: DeliveryLayout.cardRadius,
      padding: 14,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOpacity: theme.isDark ? 0.15 : 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    sectionGroupTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.navy,
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    row: { marginBottom: 10 },
    rowLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.3 },
    rowVal: { fontSize: 14, color: theme.navy, marginTop: 3, fontWeight: '600' },
    vehBox: {
      flexDirection: 'row',
      backgroundColor: theme.sky,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    vehTag: { fontSize: 10, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.5 },
    vehName: { fontSize: 17, fontWeight: '800', color: theme.navy, marginTop: 4 },
    vehLic: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
    vehThumb: {
      width: 64,
      height: 64,
      borderRadius: 10,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.sky,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    docTitle: { fontSize: 14, fontWeight: '700', color: theme.navy },
    docSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    dangerOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#DC2626',
      marginBottom: 8,
    },
    dangerOutlineText: { fontSize: 15, fontWeight: '800', color: '#DC2626' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 6,
    },
    setLabel: { fontSize: 15, fontWeight: '700', color: theme.navy },
    setHint: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    langChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.sky,
      borderWidth: 1,
      borderColor: theme.border,
    },
    langChipActive: { borderColor: DeliveryColors.red, backgroundColor: theme.isDark ? '#2A1F1F' : DeliveryColors.redLight },
    langChipText: { fontSize: 13, fontWeight: '600', color: theme.text },
    langChipTextActive: { color: DeliveryColors.red, fontWeight: '800' },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.sky,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    logoutText: { fontSize: 16, fontWeight: '800', color: DeliveryColors.red },
    ver: {
      textAlign: 'center',
      marginTop: 14,
      fontSize: 11,
      color: theme.textMuted,
      letterSpacing: 0.5,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 18,
      paddingTop: 18,
      maxHeight: '92%',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.navy, marginBottom: 14 },
    fieldLbl: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textMuted,
      marginTop: 10,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.sky,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.text,
    },
    vehPickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vehChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.sky,
      borderWidth: 1,
      borderColor: theme.border,
    },
    vehChipOn: { borderColor: DeliveryColors.red, backgroundColor: theme.isDark ? '#2A1F1F' : DeliveryColors.redLight },
    vehChipTx: { fontSize: 12, fontWeight: '600', color: theme.text },
    vehChipTxOn: { color: DeliveryColors.red },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 20 },
    modalGhost: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.sky,
    },
    modalGhostTxt: { fontSize: 15, fontWeight: '700', color: theme.navy },
    modalPrimary: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: DeliveryColors.red,
    },
    modalPrimaryTxt: { fontSize: 15, fontWeight: '800', color: DeliveryColors.white },
    modalDanger: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: '#DC2626',
    },
    deleteSheet: {
      alignSelf: 'center',
      marginTop: 'auto',
      marginBottom: 'auto',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      width: '88%',
      maxWidth: 400,
    },
    deleteTitle: { fontSize: 18, fontWeight: '800', color: theme.navy, marginBottom: 8 },
    deleteMsg: { fontSize: 14, color: theme.textMuted, lineHeight: 20, marginBottom: 12 },
  });
}