import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { POPULAR_SEARCHES } from './constants';

export interface SearchPopularChipsProps {
  onSelectTerm: (term: string) => void;
}

export default function SearchPopularChips({ onSelectTerm }: SearchPopularChipsProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <>
      <Text style={styles.sectionTitle}>Popular searches in restaurants</Text>
      <View style={styles.popularGrid}>
        {POPULAR_SEARCHES.map((s) => (
          <TouchableOpacity key={s} style={styles.popularChip} onPress={() => onSelectTerm(s)}>
            <Text style={styles.popularChipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    sectionTitle: {
      fontFamily: Fonts.brandBold,
      fontSize: 16,
      color: c.text,
      marginBottom: 12,
      marginTop: 16,
    },
    popularGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    popularChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.customerSurface,
    },
    popularChipText: {
      fontFamily: Fonts.brand,
      fontSize: 13,
      color: c.text,
    },
  });
}
