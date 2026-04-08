import { Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function OrderPipelineTitle() {
  return <Text style={styles.pipelineTitle}>Order Pipeline</Text>;
}

const styles = StyleSheet.create({
  pipelineTitle: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
