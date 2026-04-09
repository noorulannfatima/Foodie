import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface CartCheckoutBarProps {
  onCheckout: () => void;
}

export default function CartCheckoutBar({ onCheckout }: CartCheckoutBarProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.checkoutBar}>
      <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    checkoutBar: {
      padding: 16,
      backgroundColor: c.customerSurface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    checkoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.secondary,
      borderRadius: 14,
      paddingVertical: 16,
      gap: 8,
    },
    checkoutBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
    },
  });
}
