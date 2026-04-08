import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

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
  if (terms.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Recent searches</Text>
      {terms.map((s) => (
        <TouchableOpacity key={s} style={styles.recentRow} onPress={() => onSelectTerm(s)}>
          <Ionicons name="time-outline" size={18} color={Colors.muted} />
          <Text style={styles.recentText}>{s}</Text>
          <TouchableOpacity onPress={() => onRemoveTerm(s)}>
            <Ionicons name="close" size={16} color={Colors.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Fonts.brandBold,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: 12,
    marginTop: 16,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
  },
});
