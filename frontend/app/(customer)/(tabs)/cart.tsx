import { View, Text, StyleSheet } from 'react-native';

export default function Customerucart() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ucart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});
