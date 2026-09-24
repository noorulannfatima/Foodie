import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, tintBg, useAppThemeColors } from '@/constants/theme';

interface AdminStatBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightBg: string;
  label: string;
  value: string;
  caption?: string;
}

export default function AdminStatBox({ icon, color, lightBg, label, value, caption }: AdminStatBoxProps) {
  const c = useAppThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        box: {
          flex: 1,
          backgroundColor: c.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.border,
          padding: 14,
          gap: 10,
        },
        icon: {
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: { fontFamily: Fonts.brand, fontSize: 12, color: c.muted },
        value: { fontFamily: Fonts.brandBlack, fontSize: 18, color: c.text, marginTop: 2 },
        caption: { fontFamily: Fonts.brand, fontSize: 11, color: c.muted, marginTop: 2 },
      }),
    [c],
  );

  return (
    <View style={styles.box}>
      <View style={[styles.icon, { backgroundColor: tintBg(color, lightBg, c.isDark) }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}
