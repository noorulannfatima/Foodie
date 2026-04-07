import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { useAuthStore } from '@/stores/authStore';
import { Loader, StarRating, Switch } from '@/components/atoms';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon - Thu',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: 'Fri - Sat',
  saturday: '',
  sunday: 'Sunday',
};

const PAYMENT_OPTIONS = ['Cash', 'Card', 'Wallet', 'Online'] as const;

export default function RestaurantProfile() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthStore();
  const { profile, profileLoading, fetchProfile, updateProfile } = useRestaurantStore();
  const [hoursModalVisible, setHoursModalVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    fetchProfile();
  }, []);

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (profileLoading && !profile) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show condensed operating hours (group similar days)
  const getDisplayHours = () => {
    const hours = profile.operatingHours;
    const groups: Array<{ label: string; open: string; close: string; isClosed: boolean }> = [];

    // Mon-Thu
    const mon = hours.monday;
    groups.push({ label: 'Mon - Thu', open: mon.open, close: mon.close, isClosed: mon.isClosed });
    // Fri-Sat
    const fri = hours.friday;
    groups.push({ label: 'Fri - Sat', open: fri.open, close: fri.close, isClosed: fri.isClosed });
    // Sunday
    const sun = hours.sunday;
    groups.push({ label: 'Sunday', open: sun.open, close: sun.close, isClosed: sun.isClosed });

    return groups;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="restaurant" size={20} color={Colors.primary} />
          <Text style={styles.brand}>FOODIE</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={profileLoading} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Restaurant Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.restaurantName}>{profile.name}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.addressText}>
                {profile.address.street}, {profile.address.city}
              </Text>
            </View>
          </View>
          {profile.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Operating Hours */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>OPERATING HOURS</Text>
          </View>
          {getDisplayHours().map((group, idx) => (
            <View key={idx} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{group.label}</Text>
              <Text style={[
                styles.hoursTime,
                group.isClosed && { color: Colors.primary },
              ]}>
                {group.isClosed ? 'Closed' : `${group.open} - ${group.close}`}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.updateHoursBtn}
            onPress={() => setHoursModalVisible(true)}
          >
            <Text style={styles.updateHoursBtnText}>Update Hours</Text>
          </TouchableOpacity>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <View style={styles.perfHeader}>
            <Text style={styles.perfTitle}>Account Performance</Text>
            <Ionicons name="star" size={24} color="#F59E0B" />
          </View>
          <View style={styles.perfStats}>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatLabel}>MONTHLY RATING</Text>
              <Text style={styles.perfStatValue}>{profile.averageRating.toFixed(1)}<Text style={styles.perfStatMax}>/5.0</Text></Text>
            </View>
            <View style={styles.perfStat}>
              <Text style={styles.perfStatLabel}>ACTIVE ORDERS</Text>
              <Text style={styles.perfStatValue}>{profile.totalOrders}</Text>
            </View>
          </View>
          <View style={styles.perfBadges}>
            {profile.isPremium && (
              <View style={styles.perfBadge}>
                <Text style={styles.perfBadgeText}>Premier Partner</Text>
              </View>
            )}
            {profile.averageRating >= 4.5 && (
              <View style={styles.perfBadge}>
                <Text style={styles.perfBadgeText}>Top 5% Locally</Text>
              </View>
            )}
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>DELIVERY SETTINGS</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Delivery Radius</Text>
            <Text style={styles.settingValue}>{profile.deliveryRadius} km</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Minimum Order</Text>
            <Text style={styles.settingValue}>{formatCurrency(profile.minimumOrder)}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Delivery Fee</Text>
            <Text style={styles.settingValue}>{formatCurrency(profile.deliveryFee)}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Estimated Time</Text>
            <Text style={styles.settingValue}>{profile.estimatedDeliveryTime} min</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>PAYMENT METHODS</Text>
          </View>
          <View style={styles.paymentMethods}>
            {PAYMENT_OPTIONS.map((method) => (
              <View key={method} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Ionicons
                    name={method === 'Cash' ? 'cash-outline' : method === 'Card' ? 'card-outline' : method === 'Wallet' ? 'wallet-outline' : 'globe-outline'}
                    size={18}
                    color={Colors.dark}
                  />
                  <Text style={styles.paymentLabel}>{method}</Text>
                </View>
                <Switch
                  value={profile.paymentMethods.includes(method)}
                  onValueChange={(val) => {
                    const methods = val
                      ? [...profile.paymentMethods, method]
                      : profile.paymentMethods.filter((m) => m !== method);
                    if (methods.length === 0) {
                      Alert.alert('Error', 'At least one payment method is required');
                      return;
                    }
                    updateProfile({ paymentMethods: methods });
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Restaurant Settings */}
        <Text style={styles.settingsTitle}>Restaurant Settings</Text>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={[styles.settingsIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsItemTitle}>Store Information</Text>
            <Text style={styles.settingsItemSub}>Update description, tags, and photos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={[styles.settingsIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="notifications-outline" size={18} color="#3B82F6" />
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsItemTitle}>Notification Preferences</Text>
            <Text style={styles.settingsItemSub}>Order alerts, marketing, and reviews</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={[styles.settingsIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
          </View>
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsItemTitle}>Payouts & Billing</Text>
            <Text style={styles.settingsItemSub}>Manage bank accounts and invoices</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Operating Hours Modal */}
      <Modal visible={hoursModalVisible} animationType="slide" presentationStyle="pageSheet">
        <OperatingHoursModal
          hours={profile.operatingHours}
          onClose={() => setHoursModalVisible(false)}
          onSave={async (hours) => {
            try {
              await updateProfile({ operatingHours: hours });
              setHoursModalVisible(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update hours');
            }
          }}
        />
      </Modal>
    </View>
  );
}

function OperatingHoursModal({
  hours,
  onClose,
  onSave,
}: {
  hours: Record<string, { open: string; close: string; isClosed: boolean }>;
  onClose: () => void;
  onSave: (hours: Record<string, { open: string; close: string; isClosed: boolean }>) => Promise<void>;
}) {
  const [editHours, setEditHours] = useState({ ...hours });
  const [saving, setSaving] = useState(false);

  const updateDay = (day: string, field: string, value: any) => {
    setEditHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editHours);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={hoursStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={hoursStyles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={hoursStyles.title}>Operating Hours</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[hoursStyles.saveText, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={hoursStyles.content}>
        {DAYS.map((day) => (
          <View key={day} style={hoursStyles.dayRow}>
            <View style={hoursStyles.dayInfo}>
              <Text style={hoursStyles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
              <View style={hoursStyles.closedRow}>
                <Text style={hoursStyles.closedLabel}>Closed</Text>
                <Switch
                  value={editHours[day]?.isClosed ?? false}
                  onValueChange={(val) => updateDay(day, 'isClosed', val)}
                />
              </View>
            </View>
            {!editHours[day]?.isClosed && (
              <View style={hoursStyles.timeRow}>
                <TextInput
                  style={hoursStyles.timeInput}
                  value={editHours[day]?.open ?? '09:00'}
                  onChangeText={(val) => updateDay(day, 'open', val)}
                  placeholder="09:00"
                  placeholderTextColor={Colors.muted}
                />
                <Text style={hoursStyles.timeSep}>to</Text>
                <TextInput
                  style={hoursStyles.timeInput}
                  value={editHours[day]?.close ?? '22:00'}
                  onChangeText={(val) => updateDay(day, 'close', val)}
                  placeholder="22:00"
                  placeholderTextColor={Colors.muted}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontFamily: Fonts.brand,
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  retryBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  restaurantName: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  verifiedText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: '#10B981',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  hoursDay: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.text,
  },
  hoursTime: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
  },
  updateHoursBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  updateHoursBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.dark,
  },
  performanceCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  perfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  perfTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
  },
  perfStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  perfStat: {},
  perfStatLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  perfStatValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: '#fff',
  },
  perfStatMax: {
    fontFamily: Fonts.brand,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  perfBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  perfBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  perfBadgeText: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLabel: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
  settingValue: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
  },
  paymentMethods: {
    gap: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentLabel: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.text,
  },
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

const hoursStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 18,
    color: Colors.dark,
  },
  saveText: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  dayRow: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 16,
  },
  dayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
  },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedLabel: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
    textAlign: 'center',
  },
  timeSep: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
});
