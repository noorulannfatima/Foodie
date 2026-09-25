import { StatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { adminT } from '@/constants/adminStrings';
import { useAppLanguageStore } from '@/stores/appLanguageStore';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const c = useAppThemeColors();
  const bottomPad = Math.max(insets.bottom, 8);
  const language = useAppLanguageStore((s) => s.language);

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
          name="overview"
          options={{
            title: adminT(language, 'tabOverview'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payouts"
          options={{
            title: adminT(language, 'tabPayouts'),
            tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="restaurants"
          options={{
            title: adminT(language, 'tabRestaurants'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: adminT(language, 'tabSettings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
