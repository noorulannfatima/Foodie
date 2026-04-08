import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export default function RestaurantMenuHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Ionicons name="restaurant" size={20} color={Colors.primary} />
        <Text style={styles.brand}>FOODIE</Text>
      </View>
      <TouchableOpacity>
        <Ionicons name="search" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.dark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: '#fff',
    letterSpacing: 1,
  },
});
