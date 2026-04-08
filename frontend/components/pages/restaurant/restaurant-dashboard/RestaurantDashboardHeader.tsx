import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { Switch } from '@/components/atoms';

export interface RestaurantDashboardHeaderProps {
  isActive: boolean;
  onToggleActive: (value: boolean) => void;
}

export default function RestaurantDashboardHeader({
  isActive,
  onToggleActive,
}: RestaurantDashboardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Ionicons name="restaurant" size={20} color={Colors.primary} />
        <Text style={styles.brand}>FOODIE</Text>
      </View>
      <View style={styles.headerRight}>
        <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.statusText}>{isActive ? 'Open' : 'Closed'}</Text>
        <Switch value={isActive} onValueChange={onToggleActive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: '#fff',
  },
});
