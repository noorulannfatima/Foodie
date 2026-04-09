import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useAppThemeColors, Fonts } from '@/constants/theme';

/**
 * Restaurant profile shell styles — follow global dark mode (chrome + screen background).
 */
export function useRestaurantProfileStyles() {
  const c = useAppThemeColors();

  return useMemo(() => {
    const screenStyles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: c.screenBackground,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: c.screenBackground,
      },
      errorText: {
        fontFamily: Fonts.brand,
        fontSize: 16,
        color: c.muted,
        marginBottom: 12,
      },
      retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: c.primary,
      },
      retryBtnText: {
        fontFamily: Fonts.brandBold,
        fontSize: 14,
        color: '#fff',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: c.chromeDark,
      },
      headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      brand: {
        fontFamily: Fonts.brandBlack,
        fontSize: 20,
        color: '#fff',
        letterSpacing: 1,
      },
      titleSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: c.screenBackground,
      },
      tabBarWrapper: {
        backgroundColor: c.chromeDark,
        paddingHorizontal: 16,
        paddingBottom: 10,
      },
      tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        height: 44,
      },
      tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      },
      tabLabel: {
        fontFamily: Fonts.brandBold,
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
      },
      tabLabelActive: {
        color: '#fff',
      },
      tabIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        borderRadius: 9,
        backgroundColor: c.primary,
      },
      tabContent: {
        flex: 1,
        backgroundColor: c.screenBackground,
      },
      tabContentInner: {
        padding: 20,
        paddingBottom: 40,
      },
    });

    return { screenStyles };
  }, [c]);
}
