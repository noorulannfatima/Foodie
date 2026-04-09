import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export default function MenuBuilderTitle() {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.titleRow}>
      <View>
        <Text style={styles.titleMain}>
          MENU <Text style={styles.titleAccent}>BUILDER</Text>
        </Text>
        <Text style={styles.titleSub}>Manage your culinary offerings and pricing</Text>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    titleRow: {
      marginBottom: 16,
    },
    titleMain: {
      fontFamily: Fonts.brandBlack,
      fontSize: 26,
      color: c.text,
    },
    titleAccent: {
      color: c.primary,
    },
    titleSub: {
      fontFamily: Fonts.brand,
      fontSize: 14,
      color: c.muted,
      marginTop: 4,
    },
  });
}
