import { useMemo } from 'react';
import { useAppThemeColors } from '@/constants/theme';
import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard';

/** Review surfaces in the shared app theme, same as the restaurant dashboard. */
export function useDeliveryReviewPalette(): ReviewPalette {
  const c = useAppThemeColors();
  return useMemo(
    () => ({ card: c.card, text: c.text, muted: c.muted, border: c.border, accent: c.primary }),
    [c],
  );
}
