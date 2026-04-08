import { useCallback, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import { DeliveryColors, DeliveryLayout } from '@/constants/deliveryTheme';
import { deliveryAPI, type DeliveryProfile } from '@/services/api/delivery.api';
import { useAuthStore } from '@/stores/authStore';

function formatSince(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export default function DeliveryProfile() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [p, setP] = useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { profile } = await deliveryAPI.getMe();
      setP(profile);
    } catch {
      setP(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/delivery/login');
  };

  const rating = p?.stats?.averageRating?.toFixed(2) ?? '—';
  const reliability = `${p?.completionRate ?? 0}%`;

  return (
    <View style={styles.root}>
      <DeliveryHeader avatarUri={p?.profileImage ?? undefined} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={DeliveryColors.red} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.accentBar} />
          <View style={styles.heroInner}>
            <View style={styles.avatarBlock}>
              {p?.profileImage ? (
                <Image source={{ uri: p.profileImage }} style={styles.bigAvatar} />
              ) : (
                <View style={[styles.bigAvatar, styles.avatarPh]}>
                  <Ionicons name="person" size={48} color={DeliveryColors.navy} />
                </View>
              )}
              <Pressable style={styles.editFab} onPress={() => Alert.alert('Edit photo', 'Coming soon.')}>
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
                <Text style={styles.statL}>Total Orders</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statN}>{formatSince(p?.createdAt)}</Text>
                <Text style={styles.statL}>Member Since</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statN}>{reliability}</Text>
                <Text style={styles.statL}>Reliability</Text>
              </View>
            </View>
          </View>
        </View>

        <Section
          title="Personal Info"
          icon="person-outline"
          iconColor={DeliveryColors.red}
          onEdit={() => Alert.alert('Edit profile', 'Coming soon.')}
        >
          <Row label="Email Address" value={p?.email ?? '—'} />
          <Row label="Phone Number" value={p?.phone ?? '—'} />
          <Row label="Base Zone" value="Downtown Manhattan, NY" />
        </Section>

        <Section title="Vehicle Info" icon="bicycle-outline" iconColor="#38BDF8">
          <View style={styles.vehBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehTag}>PRIMARY VEHICLE</Text>
              <Text style={styles.vehName}>
                {p?.vehicle?.model ? `${p.vehicle.model}` : p?.vehicle?.type ?? 'Vehicle'}
              </Text>
              <Text style={styles.vehLic}>License: {p?.vehicle?.plateNumber ?? '—'}</Text>
            </View>
            <View style={styles.vehThumb}>
              <Ionicons name="bicycle" size={36} color={DeliveryColors.navy} />
            </View>
          </View>
        </Section>

        <Section title="Account Documents" icon="folder-outline" iconColor={DeliveryColors.red}>
          <DocRow
            icon="card-outline"
            title="Driver's License"
            subtitle={
              p?.licenseExpiry
                ? `Verified • Expires ${new Date(p.licenseExpiry).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
                : 'Verified • On file'
            }
          />
          <DocRow icon="shield-checkmark-outline" title="Insurance Policy" subtitle="Active • Renewal in 45 days" />
          <DocRow icon="document-text-outline" title="Background Check" subtitle="Completed Jan 2024" />
        </Section>

        <Section title="Settings" icon="settings-outline" iconColor="#38BDF8">
          <SettingsRow label="Notification Preferences" onPress={() => Alert.alert('Coming soon')} />
          <SettingsRow label="Navigation Settings" onPress={() => Alert.alert('Coming soon')} />
          <SettingsRow label="Privacy & Security" onPress={() => Alert.alert('Coming soon')} />
          <SettingsRow label="Help & Support" onPress={() => Alert.alert('Coming soon')} />
        </Section>

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={22} color={DeliveryColors.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
        <Text style={styles.ver}>APP VERSION 4.2.1-MESSENGER</Text>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  iconColor,
  children,
  onEdit,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: ReactNode;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={20} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onEdit ? (
          <Pressable onPress={onEdit}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowVal}>{value}</Text>
    </View>
  );
}

function DocRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable style={styles.docBox} onPress={() => Alert.alert(title, 'Document details coming soon.')}>
      <Ionicons name={icon} size={22} color={DeliveryColors.navy} />
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={DeliveryColors.textMuted} />
    </Pressable>
  );
}

function SettingsRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.setRow} onPress={onPress}>
      <Text style={styles.setLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={DeliveryColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DeliveryColors.pageBg },
  content: { paddingHorizontal: DeliveryLayout.screenPaddingH, paddingBottom: 40 },
  heroCard: {
    backgroundColor: DeliveryColors.card,
    borderRadius: DeliveryLayout.cardRadius,
    marginTop: 8,
    overflow: 'hidden',
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4, backgroundColor: DeliveryColors.red },
  heroInner: { flex: 1, padding: 16 },
  avatarBlock: { alignSelf: 'center', marginBottom: 8 },
  bigAvatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPh: { backgroundColor: DeliveryColors.sky, alignItems: 'center', justifyContent: 'center' },
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
    borderColor: DeliveryColors.card,
  },
  name: { fontSize: 22, fontWeight: '800', color: DeliveryColors.text, textAlign: 'center' },
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
  stats3: { flexDirection: 'row', marginTop: 18, borderTopWidth: 1, borderTopColor: DeliveryColors.border, paddingTop: 14 },
  statCol: { flex: 1, alignItems: 'center' },
  statN: { fontSize: 15, fontWeight: '800', color: DeliveryColors.navy },
  statL: { fontSize: 11, color: DeliveryColors.textMuted, marginTop: 4, textAlign: 'center' },
  section: {
    backgroundColor: DeliveryColors.card,
    borderRadius: DeliveryLayout.cardRadius,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: DeliveryColors.text },
  editLink: { fontSize: 14, fontWeight: '700', color: DeliveryColors.red },
  row: { marginBottom: 10 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: DeliveryColors.textMuted, letterSpacing: 0.3 },
  rowVal: { fontSize: 14, color: DeliveryColors.navy, marginTop: 3, fontWeight: '600' },
  vehBox: {
    flexDirection: 'row',
    backgroundColor: DeliveryColors.sky,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  vehTag: { fontSize: 10, fontWeight: '800', color: DeliveryColors.brownMuted, letterSpacing: 0.5 },
  vehName: { fontSize: 17, fontWeight: '800', color: DeliveryColors.navy, marginTop: 4 },
  vehLic: { fontSize: 13, color: DeliveryColors.textMuted, marginTop: 4 },
  vehThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: DeliveryColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DeliveryColors.sky,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  docTitle: { fontSize: 14, fontWeight: '700', color: DeliveryColors.navy },
  docSub: { fontSize: 12, color: DeliveryColors.textMuted, marginTop: 2 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DeliveryColors.border,
  },
  setLabel: { fontSize: 14, fontWeight: '600', color: DeliveryColors.navy },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DeliveryColors.sky,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: DeliveryColors.red },
  ver: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 11,
    color: DeliveryColors.textMuted,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
