import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontFamily: Fonts.brandBold, fontSize: 10 },
        tabBarStyle: {
          borderTopColor: '#F0F0F0',
          backgroundColor: '#fff',
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
