import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';

export interface CartCheckoutBarProps {
  onCheckout: () => void;
  /** Formatted order total, shown on the button so it's visible without scrolling. */
  total?: string;
}

export default function CartCheckoutBar({ onCheckout, total }: CartCheckoutBarProps) {
  const c = useAppThemeColors();
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onCheckout}
        accessibilityRole="button"
        accessibilityLabel={total ? t('checkoutWithTotal', { total }) : t('checkout')}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.btnText}>{t('checkout')}</Text>
        <View style={styles.right}>
          {total ? <Text style={styles.total}>{total}</Text> : null}
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    bar: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: c.brand,
    },
    pressed: {
      opacity: 0.85,
    },
    btnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: '#fff',
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    total: {
      fontFamily: Fonts.brandBlack,
      fontSize: 16,
      color: '#fff',
      fontVariant: ['tabular-nums'],
    },
  });
}
