import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export const NEGATIVE = '#DC2626';

/** Styles shared by the Payouts & Billing sheet and its sub-sheets (matches NotificationPreferencesModal). */
export function usePayoutsStyles() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return { styles, colors: c };
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerSide: { width: 24, alignItems: 'flex-end' },
    title: { fontFamily: Fonts.brandBlack, fontSize: 18, color: c.text },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    content: { padding: 20, paddingBottom: 40 },
    section: { marginTop: 24 },
    sectionTitle: { fontFamily: Fonts.brandBlack, fontSize: 16, color: c.text, marginBottom: 10 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    rowTitle: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text, flexShrink: 1 },
    rowSub: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 2 },
    body: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, lineHeight: 19 },
    amount: { fontFamily: Fonts.brandBlack, fontSize: 16, color: c.text },
    negative: { color: NEGATIVE },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.card,
    },
    bannerText: { flex: 1, fontFamily: Fonts.brand, fontSize: 13, color: c.text, lineHeight: 18 },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 14,
    },
    primaryBtnText: { fontFamily: Fonts.brandBold, fontSize: 15, color: '#FFFFFF' },
    linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
    linkBtnText: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.primary },
    label: { fontFamily: Fonts.brandBold, fontSize: 13, color: c.text, marginBottom: 6 },
    input: {
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    hint: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 4 },
    fieldError: { fontFamily: Fonts.brand, fontSize: 12, color: NEGATIVE, marginTop: 4 },
    field: { marginBottom: 16 },
  });
}
