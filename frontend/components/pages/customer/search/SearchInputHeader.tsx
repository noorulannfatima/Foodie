import { useMemo, type RefObject } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';
import { useCustomerT } from '@/stores/customerPreferencesStore';

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
  const t = useCustomerT();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
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
      paddingTop: 16,
      paddingBottom: 4,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.customerSurface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: c.customerBorder,
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
