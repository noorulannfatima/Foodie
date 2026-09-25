import { useMemo, type ReactNode } from 'react';
import { View, Text, Pressable, StatusBar, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { customerHeaderBg } from './CustomerHeader';

export interface CustomerScreenHeaderProps {
  title: string;
  /** Defaults to router.back(). */
  onBack?: () => void;
  /** Optional action on the right, same width as the back button. */
  right?: ReactNode;
}

/**
 * Header for pushed customer screens (Personal Information, Payment Methods, Order History…).
 * No coloured bar: it sits on the page colour with a back arrow and centred title.
 * Put it inside a SafeAreaView (edges top) whose background is customerHeaderBg(c).
 */
export default function CustomerScreenHeader({ title, onBack, right }: CustomerScreenHeaderProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const bg = customerHeaderBg(c);

  return (
    <View style={[styles.header, { backgroundColor: bg }]}>
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    side: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    right: {
      alignItems: 'flex-end',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
