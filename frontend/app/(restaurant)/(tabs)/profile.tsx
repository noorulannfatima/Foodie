import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurantStore } from '@/stores/restaurantStore';
import { useAuthStore } from '@/stores/authStore';
import { Loader } from '@/components/atoms';
import {
  RestaurantProfileTitle,
  RestaurantProfileTabBar,
  GeneralTab,
  AccountTab,
  SettingsTab,
  OperatingHoursModal,
  DeliverySettingsModal,
  type DeliverySettings,
  type RestaurantProfileTabKey,
} from '@/components/pages/restaurant/profile';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';

export default function RestaurantProfile() {
  const insets = useSafeAreaInsets();
  const { screenStyles } = useRestaurantProfileStyles();
  const { logout } = useAuthStore();
  const { profile, profileLoading, fetchProfile, updateProfile } = useRestaurantStore();
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<RestaurantProfileTabKey>('General');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleTabPress = (tab: RestaurantProfileTabKey, index: number) => {
    setActiveTab(tab);
    Animated.spring(indicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleSaveDeliverySettings = async (settings: DeliverySettings) => {
    // Errors propagate to the modal so it can show them inline and stay open
    await updateProfile(settings);
    setDeliveryModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  if (profileLoading && !profile) {
    return (
      <View style={[screenStyles.loadingContainer, { paddingTop: insets.top }]}>
        <Loader />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[screenStyles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={screenStyles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={screenStyles.retryBtn} onPress={() => fetchProfile()}>
          <Text style={screenStyles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + 8 }]}>

      <View style={screenStyles.titleSection}>
        <RestaurantProfileTitle profile={profile} />
      </View>

      <RestaurantProfileTabBar
        activeTab={activeTab}
        indicatorAnim={indicatorAnim}
        onTabPress={handleTabPress}
      />

      {activeTab === 'General' && (
        <GeneralTab
          profile={profile}
          refreshing={profileLoading}
          onRefresh={onRefresh}
          onOpenHoursModal={() => setHoursModalVisible(true)}
        />
      )}
      {activeTab === 'Account' && (
        <AccountTab
          profile={profile}
          refreshing={profileLoading}
          onRefresh={onRefresh}
          onUpdatePaymentMethods={(methods) => updateProfile({ paymentMethods: methods })}
          onEditDeliverySettings={() => setDeliveryModalVisible(true)}
        />
      )}
      {activeTab === 'Settings' && (
        <SettingsTab refreshing={profileLoading} onRefresh={onRefresh} onLogout={handleLogout} />
      )}

      <Modal visible={hoursModalVisible} animationType="slide" presentationStyle="pageSheet">
        <OperatingHoursModal
          hours={profile.operatingHours}
          onClose={() => setHoursModalVisible(false)}
          onSave={async (hours) => {
            try {
              await updateProfile({ operatingHours: hours });
              setHoursModalVisible(false);
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Failed to update hours';
              Alert.alert('Error', message);
            }
          }}
        />
      </Modal>

      <Modal
        visible={deliveryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDeliveryModalVisible(false)}
      >
        <DeliverySettingsModal
          settings={{
            deliveryRadius: profile.deliveryRadius,
            minimumOrder: profile.minimumOrder,
            deliveryFee: profile.deliveryFee,
            estimatedDeliveryTime: profile.estimatedDeliveryTime,
          }}
          onClose={() => setDeliveryModalVisible(false)}
          onSave={handleSaveDeliverySettings}
        />
      </Modal>
    </View>
  );
}
