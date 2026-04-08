import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface CartCheckoutBarProps {
  onCheckout: () => void;
}

export default function CartCheckoutBar({ onCheckout }: CartCheckoutBarProps) {
  return (
    <View style={styles.checkoutBar}>
      <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  checkoutBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
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
