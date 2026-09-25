import { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { RESTAURANT_PROFILE_TABS, type RestaurantProfileTabKey } from './profile.styles';
import { useRestaurantProfileStyles } from '@/hooks/useRestaurantProfileStyles';
import { useRestaurantT, type RestaurantStringKey } from '@/constants/restaurantStrings';

const TAB_LABEL_KEYS: Record<RestaurantProfileTabKey, RestaurantStringKey> = {
  General: 'profileTabGeneral',
  Account: 'profileTabAccount',
  Settings: 'profileTabSettings',
};

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
  const t = useRestaurantT();

  // Percentage translateX isn't reliable in React Native, so measure the bar and
  // move the pill by whole segments in points. The -2 accounts for the 1pt border.
  const [segmentWidth, setSegmentWidth] = useState(0);
  const translateX = Animated.multiply(indicatorAnim, segmentWidth);

  return (
    <View style={screenStyles.tabBarWrapper}>
      <View
        style={screenStyles.tabBar}
        onLayout={(e) =>
          setSegmentWidth((e.nativeEvent.layout.width - 2) / RESTAURANT_PROFILE_TABS.length)
        }
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
        {RESTAURANT_PROFILE_TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={screenStyles.tabItem}
            onPress={() => onTabPress(tab, i)}
            activeOpacity={0.8}
          >
            <Text style={[screenStyles.tabLabel, activeTab === tab && screenStyles.tabLabelActive]}>
              {t(TAB_LABEL_KEYS[tab])}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
