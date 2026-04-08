import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { screenStyles } from './profile.styles';

export interface SettingsTabProps {
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsTab({ refreshing, onRefresh, onLogout }: SettingsTabProps) {
  return (
    <ScrollView
      style={screenStyles.tabContent}
      contentContainerStyle={screenStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.settingsTitle}>Restaurant Settings</Text>

      <TouchableOpacity style={styles.settingsItem} activeOpacity={0.85}>
        <View style={[styles.settingsIcon, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
        </View>
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsItemTitle}>Store Information</Text>
          <Text style={styles.settingsItemSub}>Update description, tags, and photos</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingsItem} activeOpacity={0.85}>
        <View style={[styles.settingsIcon, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
        </View>
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsItemTitle}>Notification Preferences</Text>
          <Text style={styles.settingsItemSub}>Order alerts, marketing, and reviews</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingsItem} activeOpacity={0.85}>
        <View style={[styles.settingsIcon, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
        </View>
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsItemTitle}>Payouts & Billing</Text>
          <Text style={styles.settingsItemSub}>Manage bank accounts and invoices</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  settingsTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 18,
    color: Colors.dark,
    marginBottom: 12,
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsInfo: {
    flex: 1,
  },
  settingsItemTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  settingsItemSub: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  signOutText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
