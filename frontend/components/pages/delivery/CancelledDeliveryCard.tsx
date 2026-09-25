import { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import type { CancelledDeliveryPayload } from '@/services/api/delivery.api';

export interface CancelledDeliveryCardProps {
  order: CancelledDeliveryPayload;
  busy: boolean;
  onDismiss: () => void;
}

/** Tells the rider the customer cancelled an order they had accepted. */
export default function CancelledDeliveryCard({ order, busy, onDismiss }: CancelledDeliveryCardProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.headRow}>
        <Ionicons name="close-circle" size={22} color={c.primary} />
        <Text style={styles.title}>Order #{order.orderNumber} was cancelled</Text>
      </View>
      <Text style={styles.body}>
        The customer cancelled their order from {order.restaurantName}. You don&apos;t need to pick it up.
      </Text>
      {order.cancellationReason ? <Text style={styles.reason}>“{order.cancellationReason}”</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.pressed]}
        onPress={onDismiss}
        disabled={busy}
        accessibilityRole="button"
      >
        {busy ? <ActivityIndicator color={c.text} /> : <Text style={styles.buttonText}>Got it</Text>}
      </Pressable>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      padding: 16,
      marginBottom: 12,
    },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    title: { flex: 1, fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    body: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted, lineHeight: 20 },
    reason: { fontFamily: Fonts.brand, fontSize: 13, color: c.text, fontStyle: 'italic', marginTop: 8 },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      marginTop: 14,
    },
    buttonText: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.text },
    pressed: { opacity: 0.75 },
  });
}
