import { useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface DeliveryPageHeadingProps {
  title: string;
  /** Muted line under the title (date, week range…). */
  meta?: string;
  metaIcon?: ComponentProps<typeof Ionicons>['name'];
  /** Control on the title row, e.g. the online switch. */
  right?: ReactNode;
}

/** Page title block shared by every delivery tab, matching the restaurant headings. */
export default function DeliveryPageHeading({
  title,
  meta,
  metaIcon = 'calendar-outline',
  right,
}: DeliveryPageHeadingProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {meta ? (
        <View style={styles.metaRow}>
          <Ionicons name={metaIcon} size={16} color={c.muted} />
          <Text style={styles.metaText}>{meta}</Text>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: {
      flexShrink: 1,
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    metaText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
