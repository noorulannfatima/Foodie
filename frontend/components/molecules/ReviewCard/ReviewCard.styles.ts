import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

/**
 * Colors a review surface needs. Restaurant screens pass app theme colors and
 * delivery screens pass the same app theme, so the same components fit both.
 */
export interface ReviewPalette {
  card: string;
  text: string;
  muted: string;
  border: string;
  /** Buttons and pull-to-refresh tint. */
  accent: string;
}

export function createReviewCardStyles(p: ReviewPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: p.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: {
      flex: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: p.text,
    },
    comment: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      lineHeight: 20,
      color: p.text,
      marginTop: 8,
    },
    meta: {
      fontFamily: Fonts.brand,
      fontSize: 12,
      color: p.muted,
      marginTop: 8,
    },
  });
}
