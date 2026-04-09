import { useMemo, type RefObject } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface SearchInputHeaderProps {
  inputRef: RefObject<TextInput | null>;
  query: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export default function SearchInputHeader({
  inputRef,
  query,
  onChangeText,
  onSubmit,
  onClear,
}: SearchInputHeaderProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search for restaurants and groceries"
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={onChangeText}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={onClear}>
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    searchHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.isDark ? c.card : '#F5F5F5',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.border,
    },
    searchInput: {
      flex: 1,
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
      padding: 0,
    },
  });
}
