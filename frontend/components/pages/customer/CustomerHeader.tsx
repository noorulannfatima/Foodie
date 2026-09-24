import { useMemo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';

export interface CustomerHeaderProps {
  /** Optional contextual action on the right, e.g. clearing the cart. */
  right?: ReactNode;
  /** Match whatever sits directly below: 'surface' where a white section follows. */
  background?: 'page' | 'surface';
}

/**
 * The one top bar for every customer tab (Explore, Search, Cart, Profile).
 * No bar of its own: it takes the page color so it reads as part of the screen.
 * Place it inside a SafeAreaView with edges={['top']} using customerHeaderBg().
 */
export function customerHeaderBg(
  c: ReturnType<typeof useAppThemeColors>,
  background: CustomerHeaderProps['background'] = 'page',
) {
  return background === 'surface' ? c.customerSurface : c.customerBodyBg;
}

export default function CustomerHeader({ right, background = 'page' }: CustomerHeaderProps) {
  const c = useAppThemeColors(); // customer nav bar tracks global appearance toggle
  const styles = useMemo(() => createHeaderStyles(c), [c]);

  return (
    <View style={[styles.header, { backgroundColor: customerHeaderBg(c, background) }]}>
      <StatusBar
        barStyle={c.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={customerHeaderBg(c, background)}
      />
      <View style={styles.bar}>
        <Text style={styles.headerLogo}>FOODIE</Text>
        {right && <View style={styles.right}>{right}</View>}
      </View>
    </View>
  );
}

/** Icon button for the header's right slot. */
export function CustomerHeaderAction({
  icon,
  onPress,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
}) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createHeaderStyles(c), [c]);
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={c.customerTextPrimary} />
    </Pressable>
  );
}

function createHeaderStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingBottom: 14,
      paddingTop: Platform.OS === 'android' ? 8 : 4,
    },
    // Same 36pt row height the header had with its icons, so content doesn't shift.
    bar: { height: 36, alignItems: 'center', justifyContent: 'center' },
    headerLogo: {
      fontSize: 18,
      fontFamily: Fonts.brandBlack,
      color: c.primary,
      letterSpacing: 3,
    },
    right: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    actionBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.75 },
  });
}
