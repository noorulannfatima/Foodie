import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryColors, getDeliveryTabTheme } from '@/constants/deliveryTheme';
import { useAppThemeStore } from '@/stores/appThemeStore';

function TabIcon({
  name,
  focused,
  theme,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  theme: ReturnType<typeof getDeliveryTabTheme>;
}) {
  const styles = useMemo(() => createTabIconStyles(theme), [theme]);
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? DeliveryColors.red : theme.textMuted} />
    </View>
  );
}

export default function DeliveryTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const isDark = useAppThemeStore((s) => s.isDark);
  const theme = useMemo(() => getDeliveryTabTheme(isDark), [isDark]); // tab chrome matches delivery page tokens

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: DeliveryColors.red,
      tabBarInactiveTintColor: theme.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
      tabBarStyle: {
        borderTopColor: theme.border,
        backgroundColor: theme.card,
        paddingTop: 6,
        paddingBottom: bottomPad,
        minHeight: 52 + bottomPad,
      },
    }),
    [theme, bottomPad],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="speedometer-outline" focused={focused} theme={theme} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon name="cash-outline" focused={focused} theme={theme} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name="car-outline" focused={focused} theme={theme} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} theme={theme} />,
        }}
      />
    </Tabs>
  );
}

function createTabIconStyles(theme: ReturnType<typeof getDeliveryTabTheme>) {
  return StyleSheet.create({
    iconWrap: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    iconWrapActive: {
      backgroundColor: theme.redLight,
    },
  });
}
