import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

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
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Ionicons name={icon} size={24} color={iconColor || c.secondary} />
      </View>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    statBox: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    statLabel: {
      fontFamily: Fonts.brandBold,
      fontSize: 11,
      color: c.muted,
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
      color: c.text,
    },
    statSublabel: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginTop: 4,
    },
  });
}
