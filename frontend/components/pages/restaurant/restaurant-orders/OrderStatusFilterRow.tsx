import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { STATUS_FILTERS } from './constants';

export interface OrderStatusFilterRowProps {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export default function OrderStatusFilterRow({ activeFilter, onSelectFilter }: OrderStatusFilterRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {STATUS_FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
          onPress={() => onSelectFilter(filter)}
        >
          <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    maxHeight: 48,
    paddingLeft: 16,
  },
  filterContent: {
    gap: 8,
    paddingRight: 16,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  filterText: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.muted,
  },
  filterTextActive: {
    color: '#fff',
  },
});
