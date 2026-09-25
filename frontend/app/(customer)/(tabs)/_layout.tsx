import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const t = useCustomerT();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
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
        name="home"
        options={{
          title: t('tabExplore'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabSearch'),
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabCart'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
