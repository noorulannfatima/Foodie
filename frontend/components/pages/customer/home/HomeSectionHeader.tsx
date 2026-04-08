import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export interface HomeSectionHeaderProps {
  title: string;
  marginTop?: number;
  rightLabel?: string;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

export default function HomeSectionHeader({
  title,
  marginTop = 0,
  rightLabel,
  showViewAll,
  onViewAllPress,
}: HomeSectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, { marginTop }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showViewAll ? (
        <Pressable onPress={onViewAllPress}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      ) : rightLabel ? (
        <Text style={styles.restaurantCount}>{rightLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: Colors.text,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: Fonts.brandBold,
    color: Colors.primary,
  },
  restaurantCount: {
    fontSize: 12,
    fontFamily: Fonts.brand,
    color: Colors.muted,
  },
});
