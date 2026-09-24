import type { ReviewPalette } from '@/components/molecules/ReviewCard/ReviewCard.styles';
import type { DeliveryTabTheme } from './deliveryTheme';
import { BRAND_RED_ON_DARK } from './theme';

/** Review card/list colors in the delivery theme. */
export function getDeliveryReviewPalette(theme: DeliveryTabTheme): ReviewPalette {
  return {
    card: theme.card,
    text: theme.navy, // navy flips to light text in dark mode
    muted: theme.textMuted,
    border: theme.border,
    // Brand red is unreadable as text on dark cards
    accent: theme.isDark ? BRAND_RED_ON_DARK : theme.red,
  };
}
