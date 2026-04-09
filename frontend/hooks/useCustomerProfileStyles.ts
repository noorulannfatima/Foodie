import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppThemeColors, type AppColors } from '@/constants/theme';

function buildProfileColors(c: AppColors) {
  return {
    primary: c.primary,
    secondary: c.customerSecondary,
    tertiary: c.customerTertiary,
    neutral: c.customerNeutral,
    background: c.customerBodyBg,
    surface: c.customerSurface,
    border: c.customerBorder,
    textPrimary: c.customerTextPrimary,
    textSecondary: c.customerTextSecondary,
    textMuted: c.customerTextMuted,
  };
}

/**
 * Customer profile — theme-aware Colors + StyleSheets (follows global dark mode).
 */
export function useCustomerProfileStyles() {
  const app = useAppThemeColors();

  return useMemo(() => {
    const Colors = buildProfileColors(app);

    const sharedStyles = StyleSheet.create({
      tabContent: { flex: 1, backgroundColor: Colors.background },
      tabContentInner: { padding: 16, paddingBottom: 40 },
      listCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: app.isDark ? 0.25 : 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        marginBottom: 14,
      },
      listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 18,
      },
      listRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
      rowIcon: { marginRight: 14 },
      listRowLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
      divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 18 },
    });

    const screenStyles = StyleSheet.create({
      safe: { flex: 1, backgroundColor: Colors.neutral },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: Colors.neutral,
      },
      headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
      headerBrand: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 2 },
      tabBarWrapper: {
        backgroundColor: Colors.neutral,
        paddingHorizontal: 16,
        paddingBottom: 0,
      },
      tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        height: 44,
      },
      tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
      tabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
      tabLabelActive: { color: '#fff', fontWeight: '700' },
      tabIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        borderRadius: 9,
        backgroundColor: Colors.primary,
      },
    });

    return { Colors, sharedStyles, screenStyles, app };
  }, [app]);
}
