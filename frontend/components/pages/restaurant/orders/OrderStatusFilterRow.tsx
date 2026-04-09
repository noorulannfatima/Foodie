import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { STATUS_FILTERS } from './constants';

export interface OrderStatusFilterRowProps {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export default function OrderStatusFilterRow({ activeFilter, onSelectFilter }: OrderStatusFilterRowProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
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

function createStyles(c: AppColors) {
  const activeBg = c.chromeDark;
  return StyleSheet.create({
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
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipActive: {
      backgroundColor: activeBg,
      borderColor: activeBg,
    },
    filterText: {
      fontFamily: Fonts.brandBold,
      fontSize: 13,
      color: c.muted,
    },
    filterTextActive: {
      color: '#fff',
    },
  });
}
