import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ListRow from './ListRow';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { useAppThemeStore } from '@/stores/appThemeStore';

interface SettingsTabProps {
  user: { email: string } | null;
  onLogout: () => void;
}

export default function SettingsTab({ user, onLogout }: SettingsTabProps) {
  const { Colors, sharedStyles } = useCustomerProfileStyles();
  const isDark = useAppThemeStore((s) => s.isDark);
  const setIsDark = useAppThemeStore((s) => s.setIsDark);

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
          backgroundColor: Colors.primary,
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
    <ScrollView
      style={sharedStyles.tabContent}
      contentContainerStyle={sharedStyles.tabContentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={sharedStyles.listCard}>
        <View style={styles.darkRow}>
          <View style={styles.darkLabelWrap}>
            <Text style={styles.darkTitle}>Dark mode</Text>
            <Text style={styles.darkSub}>Easier on the eyes in low light</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={setIsDark}
            trackColor={{ false: Colors.border, true: '#FCA5A5' }}
            thumbColor={isDark ? Colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={sharedStyles.divider} />
        <ListRow
          icon={
            <Ionicons name="notifications-outline" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
          }
          label="Notification Settings"
          onPress={() => {}}
        />
        <View style={sharedStyles.divider} />
        <ListRow
          icon={
            <Ionicons name="globe-outline" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
          }
          label="Language"
          onPress={() => {}}
          rightElement={
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>English (US)</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          }
        />
        <View style={sharedStyles.divider} />
        <ListRow
          icon={
            <MaterialCommunityIcons name="ruler" size={22} color={Colors.neutral} style={sharedStyles.rowIcon} />
          }
          label="Measurement System"
          onPress={() => {}}
          rightElement={
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>Metric (kg, km)</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          }
        />
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LEGAL & ABOUT</Text>
      <View style={sharedStyles.listCard}>
        <ListRow
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://example.com/privacy')}
          rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
        />
        <View style={sharedStyles.divider} />
        <ListRow
          label="Terms of Service"
          onPress={() => Linking.openURL('https://example.com/terms')}
          rightElement={<MaterialIcons name="open-in-new" size={18} color={Colors.textMuted} />}
        />
        <View style={sharedStyles.divider} />
        <ListRow label="App Version" rightElement={<Text style={styles.versionText}>v4.12.0 (Build 892)</Text>} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {user?.email && <Text style={styles.loggedInAs}>Logged in as {user.email}</Text>}
    </ScrollView>
  );
}
