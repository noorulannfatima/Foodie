import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors, Fonts } from '@/constants/theme';

export interface DashboardStatBoxProps {
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  sublabel: string;
  iconColor?: string;
}

export default function DashboardStatBox({
  label,
  value,
  icon,
  sublabel,
  iconColor,
}: DashboardStatBoxProps) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Ionicons name={icon} size={24} color={iconColor || Colors.secondary} />
      </View>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statLabel: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
  },
  statSublabel: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
});
