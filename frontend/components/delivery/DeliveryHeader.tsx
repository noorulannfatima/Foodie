import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryColors } from '@/constants/deliveryTheme';

type Props = {
  onMenuPress?: () => void;
  online?: boolean;
  onOnlineToggle?: (next: boolean) => void;
  onlineLoading?: boolean;
  avatarUri?: string | null;
  /** Secondary header row (e.g. Order Console subtitle + status pill) */
  subtitleRow?: React.ReactNode;
};

export default function DeliveryHeader({
  onMenuPress,
  online = false,
  onOnlineToggle,
  onlineLoading,
  avatarUri,
  subtitleRow,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.bar}>
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="menu" size={26} color={DeliveryColors.white} />
        </Pressable>
        <Text style={styles.brand}>FOODIE</Text>
        <View style={styles.right}>
          {onOnlineToggle ? (
            <Pressable
              onPress={() => onOnlineToggle(!online)}
              disabled={onlineLoading}
              style={({ pressed }) => [
                styles.onlinePill,
                online ? styles.onlineOn : styles.onlineOff,
                pressed && { opacity: 0.85 },
              ]}
            >
              {onlineLoading ? (
                <ActivityIndicator size="small" color={DeliveryColors.white} />
              ) : (
                <>
                  <Ionicons
                    name="cellular"
                    size={14}
                    color={online ? DeliveryColors.white : DeliveryColors.textMuted}
                  />
                  <Text style={[styles.onlineText, online && styles.onlineTextOn]}>
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={20} color={DeliveryColors.navy} />
            )}
          </View>
        </View>
      </View>
      {subtitleRow ? <View style={styles.subRow}>{subtitleRow}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DeliveryColors.navy,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  iconBtn: { padding: 4 },
  brand: {
    color: DeliveryColors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  onlineOn: { backgroundColor: 'rgba(34,197,94,0.95)' },
  onlineOff: { backgroundColor: 'rgba(255,255,255,0.2)' },
  onlineText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color: 'rgba(255,255,255,0.85)' },
  onlineTextOn: { color: DeliveryColors.white },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: DeliveryColors.gold,
    backgroundColor: DeliveryColors.sky,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  subRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
