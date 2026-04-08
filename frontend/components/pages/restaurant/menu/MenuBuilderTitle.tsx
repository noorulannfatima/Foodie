import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function MenuBuilderTitle() {
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

const styles = StyleSheet.create({
  titleRow: {
    marginBottom: 16,
  },
  titleMain: {
    fontFamily: Fonts.brandBlack,
    fontSize: 26,
    color: Colors.dark,
  },
  titleAccent: {
    color: Colors.primary,
  },
  titleSub: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
});
