/** Design tokens for delivery (messenger) app — aligned with FOODIE delivery UI. */
export const DeliveryColors = {
  navy: '#001F3F',
  navyMuted: '#1A3A5C',
  red: '#C40018',
  redLight: '#FFE8EA',
  gold: '#E5B80B',
  brown: '#8B6914',
  brownMuted: '#A67C52',
  sky: '#E8F4FC',
  skyDeep: '#B8D9F0',
  pageBg: '#F0F4F8',
  card: '#FFFFFF',
  text: '#0D1B2A',
  textMuted: '#6B7C93',
  border: '#E2E8F0',
  online: '#22C55E',
  white: '#FFFFFF',
  peach: '#FFE8DC',
};

export const DeliveryLayout = {
  screenPaddingH: 16,
  cardRadius: 14,
  sectionGap: 20,
};

/** Theme overrides for delivery tabs when global dark mode is on (shared app store + delivery API sync). */
export function getDeliveryTabTheme(isDark: boolean) {
  if (!isDark)
    return {
      ...DeliveryColors,
      isDark: false as const,
      /** Top delivery header stays branded navy in light mode. */
      headerBackground: '#001F3F',
    };
  return {
    ...DeliveryColors,
    isDark: true as const,
    pageBg: '#0B1526',
    card: '#152535',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#2A3F55',
    sky: '#1A2838',
    skyDeep: '#243449',
    /** In dark UI, former “navy” tokens are flipped for text on cards; header uses `headerBackground`. */
    navy: '#E2E8F0',
    navyMuted: '#CBD5E1',
    white: '#F8FAFC',
    redLight: 'rgba(196,0,24,0.22)',
    peach: '#2A231C',
    /** Slightly lifted from pageBg so the app bar reads as a stripe. */
    headerBackground: '#061420',
  };
}

export type DeliveryTabTheme = ReturnType<typeof getDeliveryTabTheme>;
