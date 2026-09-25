import { StatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { useRestaurantT } from '@/constants/restaurantStrings';

export default function RestaurantTabsLayout() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <>
      <StatusBar
        barStyle={c.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.screenBackground}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: { fontFamily: Fonts.brandBold, fontSize: 10 },
          tabBarStyle: {
            borderTopColor: c.border,
            backgroundColor: c.card,
            paddingTop: 4,
            paddingBottom: bottomPad,
            minHeight: 52 + bottomPad,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t('tabDashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: t('tabOrders'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: t('tabMenu'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabProfile'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
