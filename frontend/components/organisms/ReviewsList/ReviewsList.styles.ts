import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';
import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard.styles';

export function createReviewsListStyles(p: ReviewPalette) {
  return StyleSheet.create({
    state: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
      gap: 8,
    },
    stateText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: p.muted,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: p.accent,
    },
    retryBtnText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
    footer: {
      paddingVertical: 16,
    },
  });
}
