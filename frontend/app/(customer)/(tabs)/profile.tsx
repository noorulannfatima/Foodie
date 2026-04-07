import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const Colors = {
  primary: '#D62828',
  secondary: '#F77F00',
  tertiary: '#FCBF49',
  neutral: '#003049',
  background: '#EEF2F7',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#003049',
  textSecondary: '#5A7184',
  textMuted: '#94A3B8',
};

type TabKey = 'Personal' | 'Business' | 'Settings';
const TABS: TabKey[] = ['Personal', 'Business', 'Settings'];

// ─── List row ─────────────────────────────────────────────────────────────────
interface ListRowProps {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}
function ListRow({ icon, label, onPress, rightElement }: ListRowProps) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.listRowLeft}>
        {icon}
        <Text style={styles.listRowLabel}>{label}</Text>
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

// ─── Personal Tab ──────────────────────────────────────────────────────────────
function PersonalTab({ user }: { user: { name: string; email: string } | null }) {
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBadge}
            activeOpacity={0.8}
            onPress={() => router.push('/(customer)/personal-information')}
          >
            <Ionicons name="pencil" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? 'Guest User'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? 'user@example.com'}</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM MEMBER</Text>
          </View>
        </View>
      </View>

      {/* Action list */}
      <View style={styles.listCard}>
        <ListRow
          icon={
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={Colors.neutral}
              style={styles.rowIcon}
            />
          }
          label="Personal Information"
          onPress={() => router.push('/(customer)/personal-information')}
        />
        <View style={styles.divider} />
        <ListRow
          icon={
            <MaterialIcons
              name="payment"
              size={22}
              color={Colors.neutral}
              style={styles.rowIcon}
            />
          }
          label="Payment Methods"
          onPress={() => router.push('/(customer)/payment-methods')}
        />
      </View>

      {/* Loyalty card */}
      <View style={styles.loyaltyCard}>
        <View style={styles.loyaltyHeader}>
          <MaterialCommunityIcons name="crown-outline" size={20} color={Colors.tertiary} />
          <Text style={styles.loyaltyTitle}>Loyalty Points</Text>
        </View>
        <Text style={styles.loyaltyPoints}>0 pts</Text>
        <Text style={styles.loyaltySub}>Earn points on every order</Text>
      </View>
    </ScrollView>
  );
}

// ─── Business Tab ──────────────────────────────────────────────────────────────
function BusinessTab() {
  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.businessTitle}>Your Path</Text>
      <Text style={styles.businessSubtitle}>
        Choose how you want to partner with the culinary world.
      </Text>

      {/* Restaurant card */}
      <View style={styles.businessCard}>
        <View style={[styles.businessImagePlaceholder, { backgroundColor: '#92400E' }]}>
          <MaterialIcons name="restaurant" size={52} color="rgba(255,255,255,0.25)" />
        </View>
        <View style={styles.businessCardBody}>
          <View style={styles.tierRow}>
            <MaterialIcons name="restaurant-menu" size={13} color={Colors.primary} />
            <Text style={styles.tierLabel}>PARTNER TIER</Text>
          </View>
          <Text style={styles.businessCardTitle}>Restaurant Owner</Text>
          <Text style={styles.businessCardDesc}>
            Reach thousands of hungry customers and scale your kitchen operations with our
            professional logistics network.
          </Text>
          <TouchableOpacity
            style={styles.businessBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/restaurant/signup')}
          >
            <Text style={styles.businessBtnText}>Register Store</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/restaurant/login')}
            style={styles.alreadyLink}
          >
            <Text style={styles.alreadyLinkText}>Already registered? Sign in →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery card */}
      <View style={[styles.businessCard, styles.businessCardDark]}>
        <View style={[styles.businessImagePlaceholder, { backgroundColor: '#1F2937' }]}>
          <MaterialCommunityIcons name="motorbike" size={52} color="rgba(255,255,255,0.2)" />
        </View>
        <View style={styles.businessCardBody}>
          <View style={styles.tierRow}>
            <MaterialCommunityIcons name="motorbike" size={13} color={Colors.secondary} />
            <Text style={[styles.tierLabel, { color: Colors.secondary }]}>FLEXIBLE WORK</Text>
          </View>
          <Text style={[styles.businessCardTitle, { color: '#fff' }]}>Delivery Driver</Text>
          <Text style={[styles.businessCardDesc, { color: 'rgba(255,255,255,0.65)' }]}>
            Be your own boss. Earn competitive rates while delivering the best culinary
            experiences in your city.
          </Text>
          <TouchableOpacity
            style={styles.businessBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/delivery/signup')}
          >
            <Text style={styles.businessBtnText}>Become a Rider</Text>
            <MaterialCommunityIcons name="bike-fast" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/delivery/login')}
            style={styles.alreadyLink}
          >
            <Text style={[styles.alreadyLinkText, { color: 'rgba(255,255,255,0.5)' }]}>
              Already a rider? Sign in →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Perks */}
      <View style={styles.perksRow}>
        <View style={styles.perkItem}>
          <View style={styles.perkIcon}>
            <MaterialIcons name="payment" size={22} color={Colors.neutral} />
          </View>
          <Text style={styles.perkTitle}>Weekly Payouts</Text>
          <Text style={styles.perkDesc}>Direct deposit every Monday morning.</Text>
        </View>
        <View style={styles.perkItem}>
          <View style={styles.perkIcon}>
            <MaterialIcons name="support-agent" size={22} color={Colors.neutral} />
          </View>
          <Text style={styles.perkTitle}>24/7 Support</Text>
          <Text style={styles.perkDesc}>Priority help for business partners.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({
  user,
  onLogout,
}: {
  user: { email: string } | null;
  onLogout: () => void;
}) {
  return (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={styles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={styles.listCard}>
        <ListRow
          icon={
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.neutral}
              style={styles.rowIcon}
            />
          }
          label="Notification Settings"
          onPress={() => { }}
        />
        <View style={styles.divider} />
        <ListRow
          icon={
            <Ionicons name="globe-outline" size={22} color={Colors.neutral} style={styles.rowIcon} />
          }
          label="Language"
          onPress={() => { }}
          rightElement={
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>English (US)</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          }
        />
        <View style={styles.divider} />
        <ListRow
          icon={
            <MaterialCommunityIcons
              name="ruler"
              size={22}
              color={Colors.neutral}
              style={styles.rowIcon}
            />
          }
          label="Measurement System"
          onPress={() => { }}
          rightElement={
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>Metric (kg, km)</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          }
        />
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LEGAL & ABOUT</Text>
      <View style={styles.listCard}>
        <ListRow
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://example.com/privacy')}
          rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
        />
        <View style={styles.divider} />
        <ListRow
          label="Terms of Service"
          onPress={() => Linking.openURL('https://example.com/terms')}
          rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
        />
        <View style={styles.divider} />
        <ListRow
          label="App Version"
          rightElement={<Text style={styles.versionText}>v4.12.0 (Build 892)</Text>}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {user?.email && <Text style={styles.loggedInAs}>Logged in as {user.email}</Text>}
    </ScrollView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const [activeTab, setActiveTab] = useState<TabKey>('Personal');
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const { user, logout } = useAuthStore();

  const handleTabPress = (tab: TabKey, index: number) => {
    setActiveTab(tab);
    Animated.spring(indicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const translateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '100%', '200%'],
  });

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.neutral} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerBrand}>FOODIE</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab, i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[
              styles.tabIndicator,
              { width: '33.33%', transform: [{ translateX }] },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      {activeTab === 'Personal' && <PersonalTab user={user} />}
      {activeTab === 'Business' && <BusinessTab />}
      {activeTab === 'Settings' && <SettingsTab user={user} onLogout={handleLogout} />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutral },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: Colors.neutral
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
  headerBrand: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },

  tabBarWrapper: { backgroundColor: Colors.neutral, paddingHorizontal: 16, paddingBottom: 0 },
  tabBar: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, overflow: 'hidden', position: 'relative', height: 44
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', top: 4, bottom: 4, left: 4,
    borderRadius: 9, backgroundColor: Colors.primary
  },

  tabContent: { flex: 1, backgroundColor: Colors.background },
  tabContentInner: { padding: 16, paddingBottom: 40 },

  // Personal
  profileCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, marginBottom: 14
  },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.neutral,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarInitials: { fontSize: 24, fontWeight: '700', color: '#fff' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
    borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: Colors.surface
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textSecondary },
  premiumBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FEF3C7', borderColor: '#FBBF24',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10,
    paddingVertical: 3, marginTop: 4
  },
  premiumText: { fontSize: 10, fontWeight: '700', color: '#92400E', letterSpacing: 0.8 },

  listCard: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2, marginBottom: 14
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18
  },
  listRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { marginRight: 14 },
  listRowLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 18 },

  loyaltyCard: {
    backgroundColor: Colors.neutral, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4
  },
  loyaltyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  loyaltyTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },
  loyaltyPoints: { fontSize: 32, fontWeight: '800', color: Colors.tertiary, marginBottom: 2 },
  loyaltySub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },

  // Business
  businessTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  businessSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  businessCard: {
    backgroundColor: Colors.surface, borderRadius: 20, overflow: 'hidden',
    marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3
  },
  businessCardDark: { backgroundColor: Colors.neutral },
  businessImagePlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center' },
  businessCardBody: { padding: 18, gap: 8 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1.2 },
  businessCardTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  businessCardDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  businessBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, gap: 8, marginTop: 4
  },
  businessBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  alreadyLink: { alignItems: 'center', paddingVertical: 4 },
  alreadyLinkText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  perksRow: { flexDirection: 'row', gap: 12 },
  perkItem: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  perkIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4
  },
  perkTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  perkDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  // Settings
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.primary,
    letterSpacing: 1.4, marginBottom: 10, marginLeft: 4
  },
  settingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 13, color: Colors.textSecondary },
  versionText: { fontSize: 13, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    gap: 10, marginTop: 28, shadowColor: Colors.primary,
    shadowOpacity: 0.4, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  loggedInAs: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 12 },
});