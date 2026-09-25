import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import type { DeliveryReleaseReason } from '@/services/api/delivery.api';
import { RELEASE_REASON_OPTIONS } from './releaseReasons';

export interface DeliveryReleaseSheetProps {
  orderNumber: string;
  /** Releases the order; the sheet closes once it resolves. */
  onChoose: (reason: DeliveryReleaseReason) => Promise<void>;
  onClose: () => void;
}

/** Page-sheet reason picker for handing an accepted order back before pickup. */
export default function DeliveryReleaseSheet({ orderNumber, onChoose, onClose }: DeliveryReleaseSheetProps) {
  const c = useAppThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(c), [c]);
  const [saving, setSaving] = useState<DeliveryReleaseReason | null>(null);

  const choose = async (reason: DeliveryReleaseReason) => {
    setSaving(reason);
    try {
      await onChoose(reason);
      onClose();
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.title}>Release order</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          Order #{orderNumber} goes back to other riders. Tell us why you can&apos;t make it.
        </Text>
        <View style={styles.card} accessibilityRole="radiogroup">
          {RELEASE_REASON_OPTIONS.map(({ value, label }, index) => (
            <Pressable
              key={value}
              onPress={() => choose(value)}
              disabled={saving !== null}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
            >
              <Text style={styles.label}>{label}</Text>
              {saving === value ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBackground },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    title: { fontFamily: Fonts.brandBlack, fontSize: 18, color: c.text },
    spacer: { width: 24 },
    content: { padding: 20 },
    hint: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, lineHeight: 19, marginBottom: 16 },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingVertical: 12,
      paddingHorizontal: 18,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
    label: { flex: 1, fontFamily: Fonts.brandBold, fontSize: 15, color: c.text },
    pressed: { opacity: 0.7 },
  });
}
