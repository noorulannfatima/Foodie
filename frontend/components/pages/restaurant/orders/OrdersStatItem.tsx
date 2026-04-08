import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors, Fonts } from '@/constants/theme';

export interface OrdersStatItemProps {
  label: string;
  value: number;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export default function OrdersStatItem({ label, value, icon }: OrdersStatItemProps) {
  return (
    <View style={styles.statsItem}>
      <Text style={styles.statsLabel}>{label}</Text>
      <View style={styles.statsValueRow}>
        <Text style={styles.statsValue}>{value}</Text>
        <Ionicons name={icon} size={20} color={Colors.secondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statsLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statsValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 24,
    color: Colors.dark,
  },
});
