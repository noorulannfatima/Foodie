import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { getDashboardGreeting } from './getDashboardGreeting';

export default function KitchenOverviewHero() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <Text style={styles.greeting}>{getDashboardGreeting()}, Chef</Text>
      <Text style={styles.title}>Kitchen Overview</Text>
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={16} color={Colors.muted} />
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
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
    color: Colors.muted,
  },
});
