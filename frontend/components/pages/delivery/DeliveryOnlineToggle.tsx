import { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { Switch } from '@/components/atoms';

const ONLINE = '#10B981';
const OFFLINE = '#EF4444';

export interface DeliveryOnlineToggleProps {
  online: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}

/** Status dot + label + switch; mirrors the restaurant Open/Closed control. */
export default function DeliveryOnlineToggle({ online, busy, onChange }: DeliveryOnlineToggleProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.row}>
      {busy ? (
        <ActivityIndicator size="small" color={c.muted} />
      ) : (
        <View style={[styles.dot, { backgroundColor: online ? ONLINE : OFFLINE }]} />
      )}
      <Text style={styles.label}>{online ? 'Online' : 'Offline'}</Text>
      <Switch value={online} onValueChange={onChange} disabled={busy} />
    </View>
  );
}

/** Read-only version for screens that only report the state. */
export function DeliveryOnlineStatus({ online }: { online: boolean }) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.pill} accessible accessibilityLabel={online ? 'You are online' : 'You are offline'}>
      <View style={[styles.dot, { backgroundColor: online ? ONLINE : OFFLINE }]} />
      <Text style={styles.label}>{online ? 'Online' : 'Offline'}</Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.text,
    },
  });
}
