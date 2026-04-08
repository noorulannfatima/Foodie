import type { RefObject } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

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
  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={18} color={Colors.muted} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search for restaurants and groceries"
          placeholderTextColor={Colors.muted}
          value={query}
          onChangeText={onChangeText}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={onClear}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
    padding: 0,
  },
});
