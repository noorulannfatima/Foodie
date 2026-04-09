import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface SearchRecentSectionProps {
  terms: string[];
  onSelectTerm: (term: string) => void;
  onRemoveTerm: (term: string) => void;
}

export default function SearchRecentSection({
  terms,
  onSelectTerm,
  onRemoveTerm,
}: SearchRecentSectionProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);

  if (terms.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Recent searches</Text>
      {terms.map((s) => (
        <TouchableOpacity key={s} style={styles.recentRow} onPress={() => onSelectTerm(s)}>
          <Ionicons name="time-outline" size={18} color={c.muted} />
          <Text style={styles.recentText}>{s}</Text>
          <TouchableOpacity onPress={() => onRemoveTerm(s)}>
            <Ionicons name="close" size={16} color={c.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
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
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    recentText: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
    },
  });
}
