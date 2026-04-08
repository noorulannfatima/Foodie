import { View, Text, StyleSheet } from 'react-native';
import { Spinner } from '@/components/atoms';
import { Colors, Fonts } from '@/constants/theme';

export default function SearchLoadingRow() {
  return (
    <View style={styles.loadingRow}>
      <Spinner size="small" />
      <Text style={styles.loadingText}>Searching...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: Fonts.brand,
    fontSize: 14,
    color: Colors.muted,
  },
});
