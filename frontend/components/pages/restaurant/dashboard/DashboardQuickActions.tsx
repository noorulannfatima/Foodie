import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DashboardQuickActionsProps {
  onViewOrders: () => void;
  onManageMenu: () => void;
}

export default function DashboardQuickActions({ onViewOrders, onManageMenu }: DashboardQuickActionsProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickAction} onPress={onViewOrders}>
        <Ionicons name="receipt-outline" size={20} color={c.primary} />
        <Text style={styles.quickActionText}>View All Orders</Text>
        <Ionicons name="chevron-forward" size={16} color={c.muted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAction} onPress={onManageMenu}>
        <Ionicons name="restaurant-outline" size={20} color={c.primary} />
        <Text style={styles.quickActionText}>Manage Menu</Text>
        <Ionicons name="chevron-forward" size={16} color={c.muted} />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    quickActions: {
      marginTop: 8,
      marginBottom: 24,
      gap: 8,
    },
    quickAction: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      gap: 12,
    },
    quickActionText: {
      flex: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
  });
}
