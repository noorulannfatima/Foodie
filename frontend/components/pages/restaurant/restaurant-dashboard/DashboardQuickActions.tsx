import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface DashboardQuickActionsProps {
  onViewOrders: () => void;
  onManageMenu: () => void;
}

export default function DashboardQuickActions({ onViewOrders, onManageMenu }: DashboardQuickActionsProps) {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity style={styles.quickAction} onPress={onViewOrders}>
        <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
        <Text style={styles.quickActionText}>View All Orders</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickAction} onPress={onManageMenu}>
        <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
        <Text style={styles.quickActionText}>Manage Menu</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  quickActionText: {
    flex: 1,
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
});
