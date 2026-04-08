import { StyleSheet } from 'react-native';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
export const Colors = {
  primary: '#D62828',
  secondary: '#F77F00',
  tertiary: '#FCBF49',
  neutral: '#003049',
  background: '#EEF2F7',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#003049',
  textSecondary: '#5A7184',
  textMuted: '#94A3B8',
};

export type TabKey = 'Personal' | 'Business' | 'Settings';
export const TABS: TabKey[] = ['Personal', 'Business', 'Settings'];

// ─── Shared styles ─────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  tabContent: { flex: 1, backgroundColor: Colors.background },
  tabContentInner: { padding: 16, paddingBottom: 40 },

  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
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

// ─── Screen-level styles (header, tab bar, safe area) ──────────────────────────
export const screenStyles = StyleSheet.create({
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
