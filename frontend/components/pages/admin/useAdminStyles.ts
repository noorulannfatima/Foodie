import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors } from '@/constants/theme';

/** Styles shared by the admin screens and sheets. */
export function useAdminStyles() {
  const c = useAppThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: c.screenBackground },
        content: { padding: 16, paddingBottom: 32, gap: 12 },
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
        title: { fontFamily: Fonts.brandBlack, fontSize: 26, color: c.text },
        subtitle: { fontFamily: Fonts.brand, fontSize: 13, color: c.muted, marginTop: 2 },
        sectionTitle: {
          fontFamily: Fonts.brandBlack,
          fontSize: 16,
          color: c.text,
          marginTop: 8,
        },
        card: {
          backgroundColor: c.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          padding: 16,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        rowTitle: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.text, flexShrink: 1 },
        rowSub: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted, marginTop: 2 },
        amount: { fontFamily: Fonts.brandBlack, fontSize: 16, color: c.text },
        negative: { color: '#DC2626' },
        breakdownRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 6,
        },
        breakdownLabel: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted },
        breakdownValue: { fontFamily: Fonts.brandBold, fontSize: 14, color: c.text },
        divider: { height: 1, backgroundColor: c.border, marginVertical: 6 },
        totalLabel: { fontFamily: Fonts.brandBlack, fontSize: 15, color: c.text },
        totalValue: { fontFamily: Fonts.brandBlack, fontSize: 17, color: c.text },
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
        outlineBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderWidth: 1.5,
          borderColor: c.primary,
          borderRadius: 12,
          paddingVertical: 13,
        },
        outlineBtnText: { fontFamily: Fonts.brandBold, fontSize: 15, color: c.primary },
        dangerBtn: { borderColor: '#DC2626' },
        dangerBtnText: { color: '#DC2626' },
        sheetHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        },
        sheetTitle: { fontFamily: Fonts.brandBlack, fontSize: 20, color: c.text, flexShrink: 1 },
        empty: { fontFamily: Fonts.brand, fontSize: 14, color: c.muted, textAlign: 'center' },
        error: { fontFamily: Fonts.brand, fontSize: 14, color: '#DC2626', textAlign: 'center' },
      }),
    [c],
  );

  return { styles, colors: c };
}
