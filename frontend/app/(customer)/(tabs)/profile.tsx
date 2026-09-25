import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import {
  PersonalTab,
  BusinessTab,
  SettingsTab,
  TABS,
} from '@/components/pages/customer/profile';
import type { TabKey } from '@/components/pages/customer/profile';
import CustomerHeader from '@/components/pages/customer/CustomerHeader';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { useCustomerT } from '@/stores/customerPreferencesStore';
import type { CustomerStringKey } from '@/constants/customerStrings';

const TAB_LABELS: Record<TabKey, CustomerStringKey> = {
  Personal: 'profileTabPersonal',
  Business: 'profileTabBusiness',
  Settings: 'profileTabSettings',
};

export default function CustomerProfile() {
  const { screenStyles } = useCustomerProfileStyles();
  const t = useCustomerT();
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

  // Percentage translateX isn't reliable in React Native, so measure the bar and
  // move the pill by whole segments in points. The -2 accounts for the 1pt border.
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = Animated.multiply(indicatorAnim, segmentWidth);

  const handleLogout = () => {
    Alert.alert(t('logOut'), t('logOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logOut'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={screenStyles.safe} edges={['top']}>
      <CustomerHeader />

      <View style={screenStyles.tabBarWrapper}>
        <View
          style={screenStyles.tabBar}
          onLayout={(e) => setSegmentWidth((e.nativeEvent.layout.width - 2) / TABS.length)}
        >
          {segmentWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                screenStyles.tabIndicator,
                { width: segmentWidth - 8, transform: [{ translateX }] },
              ]}
            />
          )}
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={screenStyles.tabItem}
              onPress={() => handleTabPress(tab, i)}
              activeOpacity={0.8}
            >
              <Text style={[screenStyles.tabLabel, activeTab === tab && screenStyles.tabLabelActive]}>
                {t(TAB_LABELS[tab])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'Personal' && <PersonalTab user={user} />}
      {activeTab === 'Business' && <BusinessTab />}
      {activeTab === 'Settings' && <SettingsTab user={user} onLogout={handleLogout} />}
    </SafeAreaView>
  );
}
