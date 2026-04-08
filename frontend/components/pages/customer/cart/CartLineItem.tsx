import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { CartItem } from '@/stores/cartStore';

export interface CartLineItemProps {
  item: CartItem;
  formatPrice: (amount: number) => string;
  onRemove: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
}

export default function CartLineItem({
  item,
  formatPrice,
  onRemove,
  onDecrement,
  onIncrement,
}: CartLineItemProps) {
  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        {item.specialInstructions ? (
          <Text style={styles.cartItemSub}>{item.specialInstructions}</Text>
        ) : null}
        <Text style={styles.cartItemPrice}>{formatPrice(item.price)}</Text>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Ionicons name="close" size={16} color={Colors.muted} />
      </TouchableOpacity>

      <View style={styles.quantityControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement}>
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{String(item.quantity).padStart(2, '0')}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement}>
          <Ionicons name="add" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: Fonts.brandBold,
    fontSize: 15,
    color: Colors.dark,
  },
  cartItemSub: {
    fontFamily: Fonts.brand,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  cartItemPrice: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
    marginRight: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.dark,
    minWidth: 24,
    textAlign: 'center',
  },
});
