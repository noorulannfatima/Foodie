import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { RESTAURANT_PROFILE_TABS, type RestaurantProfileTabKey } from './profile.styles';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';

export interface RestaurantProfileTabBarProps {
  activeTab: RestaurantProfileTabKey;
  indicatorAnim: Animated.Value;
  onTabPress: (tab: RestaurantProfileTabKey, index: number) => void;
}

export default function RestaurantProfileTabBar({
  activeTab,
  indicatorAnim,
  onTabPress,
}: RestaurantProfileTabBarProps) {
  const { screenStyles } = useRestaurantProfileStyles();

  const translateX = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '100%', '200%'],
  });

  return (
    <View style={screenStyles.tabBarWrapper}>
      <View style={screenStyles.tabBar}>
        {RESTAURANT_PROFILE_TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={screenStyles.tabItem}
            onPress={() => onTabPress(tab, i)}
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
  );
}
