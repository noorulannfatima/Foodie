import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useRestaurantT, useRestaurantLocale } from '@/constants/restaurantStrings';
import { Switch } from '@/components/atoms';

export interface KitchenOverviewHeroProps {
  restaurantName?: string;
  isActive: boolean;
  onToggleActive: (value: boolean) => void;
}

export default function KitchenOverviewHero({
  restaurantName,
  isActive,
  onToggleActive,
}: KitchenOverviewHeroProps) {
  const c = useAppThemeColors();
  const t = useRestaurantT();
  const locale = useRestaurantLocale();
  const styles = useMemo(() => createStyles(c), [c]);
  const dateStr = new Date().toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.greeting}>{t('dashWelcomeBack')}</Text>
        <View style={styles.status}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>{isActive ? t('dashOpen') : t('dashClosed')}</Text>
          <Switch value={isActive} onValueChange={onToggleActive} />
        </View>
      </View>
      <Text style={styles.title}>
        {restaurantName ? t('dashOverviewNamed', { name: restaurantName }) : t('dashOverview')}
      </Text>
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={16} color={c.muted} />
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 4,
    },
    greeting: {
      flexShrink: 1,
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.text,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 28,
      color: c.text,
      marginBottom: 8,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 20,
    },
    dateText: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
    },
  });
}
