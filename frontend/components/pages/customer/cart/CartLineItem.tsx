import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';
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
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item.specialInstructions ? (
            <Text style={styles.note} numberOfLines={2}>
              {item.specialInstructions}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('removeNamed', { name: item.name })}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={18} color={c.muted} />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
          {item.quantity > 1 ? <Text style={styles.each}>{t('priceEach', { price: formatPrice(item.price) })}</Text> : null}
        </View>

        <View style={styles.stepper}>
          <Pressable
            onPress={onDecrement}
            accessibilityRole="button"
            accessibilityLabel={t('decreaseQty', { name: item.name })}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          >
            <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={c.text} />
          </Pressable>
          <Text style={styles.qty} accessibilityLabel={t('quantityA11y', { count: item.quantity })}>
            {item.quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityRole="button"
            accessibilityLabel={t('increaseQty', { name: item.name })}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color={c.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 10,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    info: {
      flex: 1,
    },
    name: {
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
    },
    note: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.muted,
      marginTop: 2,
    },
    removeBtn: {
      width: 28,
      height: 28,
      marginTop: -4,
      marginRight: -6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    lineTotal: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    each: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: c.muted,
      marginTop: 2,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.screenBackground,
    },
    stepBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qty: {
      minWidth: 24,
      textAlign: 'center',
      fontFamily: Fonts.brandBold,
      fontSize: 15,
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
