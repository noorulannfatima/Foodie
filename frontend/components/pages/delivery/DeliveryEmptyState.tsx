import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DeliveryEmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Card framing for in-page slots; bare for full-list empties. */
  framed?: boolean;
}

export default function DeliveryEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  framed = false,
}: DeliveryEmptyStateProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={[styles.wrap, framed ? styles.framed : styles.bare]}>
      <Ionicons name={icon} size={framed ? 40 : 56} color={c.isDark ? c.muted : c.light} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: 6,
    },
    framed: {
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 28,
      paddingHorizontal: 20,
    },
    bare: {
      paddingVertical: 56,
      paddingHorizontal: 24,
    },
    title: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
      marginTop: 6,
    },
    message: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 20,
    },
    action: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.screenBackground,
    },
    actionText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.primary,
    },
  });
}
