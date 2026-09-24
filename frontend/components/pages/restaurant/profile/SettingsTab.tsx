import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppThemeColors, Fonts, tintBg } from '@/constants/theme';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';
import { useAppThemeStore } from '@/stores/appThemeStore';
import { useRestaurantStore } from '@/stores/restaurantStore';
import StoreInformationModal from '@/components/organisms/StoreInformationModal';
import NotificationPreferencesModal from './NotificationPreferencesModal';

export interface SettingsTabProps {
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function SettingsTab({ refreshing, onRefresh, onLogout }: SettingsTabProps) {
  const { screenStyles } = useRestaurantProfileStyles();
  const Colors = useAppThemeColors();
  const isDark = useAppThemeStore((s) => s.isDark);
  const setIsDark = useAppThemeStore((s) => s.setIsDark);
  const profile = useRestaurantStore((s) => s.profile);

  const [storeInfoModalVisible, setStoreInfoModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        settingsTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 18,
          color: Colors.text,
          marginBottom: 12,
          marginTop: 8,
        },
        darkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: Colors.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        darkLabel: { flex: 1, paddingRight: 12 },
        darkTitle: { fontFamily: Fonts.brandBold, fontSize: 15, color: Colors.text },
        darkSub: { fontFamily: Fonts.brand, fontSize: 12, color: Colors.muted, marginTop: 4 },
        settingsItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: Colors.border,
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
          color: Colors.text,
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
      }),
    [Colors],
  );

  return (
    <>
      <ScrollView
        style={screenStyles.tabContent}
        contentContainerStyle={screenStyles.tabContentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.settingsTitle}>Restaurant Settings</Text>

        <View style={styles.darkRow}>
          <View style={styles.darkLabel}>
            <Text style={styles.darkTitle}>Dark mode</Text>
            <Text style={styles.darkSub}>
              Restaurant app uses the same appearance as the rest of Foodie
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setIsDark}
            trackColor={{ false: Colors.border, true: Colors.brand }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={styles.settingsItem}
          activeOpacity={0.85}
          onPress={() => setStoreInfoModalVisible(true)}
        >
          <View
            style={[
              styles.settingsIcon,
              { backgroundColor: tintBg(Colors.primary, '#FEE2E2', isDark) },
            ]}
          >
            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsItemTitle}>Store Information</Text>
            <Text style={styles.settingsItemSub}>Update description and restaurant cover</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsItem}
          activeOpacity={0.85}
          onPress={() => setNotificationsModalVisible(true)}
        >
          <View
            style={[styles.settingsIcon, { backgroundColor: tintBg('#3B82F6', '#DBEAFE', isDark) }]}
          >
            <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsItemTitle}>Notification Preferences</Text>
            <Text style={styles.settingsItemSub}>Order alerts, marketing, and reviews</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} activeOpacity={0.85}>
          <View
            style={[styles.settingsIcon, { backgroundColor: tintBg('#F59E0B', '#FEF3C7', isDark) }]}
          >
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

      {/* Store Information Modal */}
      <StoreInformationModal
        visible={storeInfoModalVisible}
        onClose={() => setStoreInfoModalVisible(false)}
        currentDescription={profile?.description}
        currentImages={profile?.image}
      />

      <Modal
        visible={notificationsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <NotificationPreferencesModal onClose={() => setNotificationsModalVisible(false)} />
      </Modal>
    </>
  );
}
