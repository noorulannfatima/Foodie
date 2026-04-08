import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type RestaurantProfileTabKey = 'General' | 'Account' | 'Settings';

export const RESTAURANT_PROFILE_TABS: RestaurantProfileTabKey[] = ['General', 'Account', 'Settings'];

export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontFamily: Fonts.brand,
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.dark,
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
    backgroundColor: '#F8F9FA',
  },
  tabBarWrapper: {
    backgroundColor: Colors.dark,
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
    backgroundColor: Colors.primary,
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
});
