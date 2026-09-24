import { View, Text, StyleSheet } from 'react-native';
import { Fonts, tintBg } from '@/constants/theme';
import { useAppThemeStore } from '@/stores/appThemeStore';
import type { PayoutAccountStatus, PayoutStatus } from '@/services/api/admin.types';

type Status = PayoutStatus | PayoutAccountStatus | 'None';

const TONES: Record<Status, { color: string; lightBg: string; label?: string }> = {
  Processing: { color: '#D97706', lightBg: '#FEF3C7' },
  Pending: { color: '#D97706', lightBg: '#FEF3C7' },
  Paid: { color: '#059669', lightBg: '#D1FAE5' },
  Verified: { color: '#059669', lightBg: '#D1FAE5' },
  Failed: { color: '#DC2626', lightBg: '#FEE2E2' },
  Rejected: { color: '#DC2626', lightBg: '#FEE2E2' },
  None: { color: '#6B7280', lightBg: '#F3F4F6', label: 'No account' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const isDark = useAppThemeStore((s) => s.isDark);
  const tone = TONES[status];

  return (
    <View style={[styles.badge, { backgroundColor: tintBg(tone.color, tone.lightBg, isDark) }]}>
      <Text style={[styles.text, { color: tone.color }]}>{tone.label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontFamily: Fonts.brandBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
