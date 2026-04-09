import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import {
  PersonalTab,
  BusinessTab,
  SettingsTab,
  TABS,
} from '@/components/pages/customer/profile';
import type { TabKey } from '@/components/pages/customer/profile';
import { useCustomerProfileStyles } from '@/hooks/useCustomerProfileStyles';
import { useAppThemeColors } from '@/constants/theme';

export default function CustomerProfile() {
  const { screenStyles } = useCustomerProfileStyles();
  const appColors = useAppThemeColors();
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
    <SafeAreaView style={screenStyles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.customerNeutral} />

      <View style={screenStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={screenStyles.headerTitle}>Profile</Text>
        <Text style={screenStyles.headerBrand}>FOODIE</Text>
      </View>

      <View style={screenStyles.tabBarWrapper}>
        <View style={screenStyles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={screenStyles.tabItem}
              onPress={() => handleTabPress(tab, i)}
              activeOpacity={0.8}
            >
              <Text style={[screenStyles.tabLabel, activeTab === tab && screenStyles.tabLabelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[screenStyles.tabIndicator, { width: '33.33%', transform: [{ translateX }] }]}
          />
        </View>
      </View>

      {activeTab === 'Personal' && <PersonalTab user={user} />}
      {activeTab === 'Business' && <BusinessTab />}
      {activeTab === 'Settings' && <SettingsTab user={user} onLogout={handleLogout} />}
    </SafeAreaView>
  );
}
