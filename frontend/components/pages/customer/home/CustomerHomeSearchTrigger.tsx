import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface CustomerHomeSearchTriggerProps {
  onPress: () => void;
  placeholder?: string;
}

export default function CustomerHomeSearchTrigger({
  onPress,
  placeholder = 'Search for sushi, pasta, or burgers…',
}: CustomerHomeSearchTriggerProps) {
  return (
    <Pressable style={styles.searchBar} onPress={onPress}>
      <Ionicons name="search" size={18} color={Colors.muted} />
      <Text style={styles.searchPlaceholder}>{placeholder}</Text>
      <View style={styles.filterBtn}>
        <Ionicons name="options-outline" size={16} color={Colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 22,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.brand,
    color: '#94A3B8',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
