import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';
import { getGreeting } from './getGreeting';

export interface CustomerHomeHeroProps {
  userName: string;
  addressLine?: string;
}

export default function CustomerHomeHero({
  userName,
  addressLine = 'Home – 123 Street Name',
}: CustomerHomeHeroProps) {
  const c = useAppThemeColors(); // hero block background/text follow light or dark customer palette
  const styles = useMemo(() => createHeroStyles(c), [c]);

  return (
    <View style={styles.heroSection}>
      <Pressable style={styles.locationRow}>
        <Ionicons name="location-sharp" size={14} color={c.primary} />
        <Text style={styles.locationLabel}>Deliver to</Text>
        <Text style={styles.locationValue} numberOfLines={1}>
          {addressLine}
        </Text>
        <Ionicons name="chevron-down" size={14} color={c.customerTextMuted} />
      </Pressable>
      <Text style={styles.greeting}>
        {getGreeting()},{'\n'}
        <Text style={styles.greetingName}>{userName}!</Text>
      </Text>
    </View>
  );
}

function createHeroStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    heroSection: {
      backgroundColor: c.customerSurface,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      marginBottom: 16,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 14,
    },
    locationLabel: {
      fontSize: 12,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
    },
    locationValue: {
      fontSize: 12,
      fontFamily: Fonts.brandBold,
      color: c.customerTextPrimary,
      flex: 1,
    },
    greeting: {
      fontSize: 15,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
      lineHeight: 26,
    },
    greetingName: {
      fontSize: 28,
      fontFamily: Fonts.brandBlack,
      color: c.customerTextPrimary,
      lineHeight: 36,
    },
  });
}
