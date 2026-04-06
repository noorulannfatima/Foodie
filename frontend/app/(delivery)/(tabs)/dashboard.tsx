import { View, Text, StyleSheet } from 'react-native';

export default function Deliveryudashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>udashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});
