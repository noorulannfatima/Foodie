import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors } from '@/constants/theme';

export interface CustomerHomeSearchTriggerProps {
  onPress: () => void;
  placeholder?: string;
}

export default function CustomerHomeSearchTrigger({
  onPress,
  placeholder = 'Search for sushi, pasta, or burgers…',
}: CustomerHomeSearchTriggerProps) {
  const c = useAppThemeColors(); // search chip uses customerSurface + subtle border in dark mode
  const styles = useMemo(() => createSearchStyles(c), [c]);

  return (
    <Pressable style={styles.searchBar} onPress={onPress}>
      <Ionicons name="search" size={18} color={c.customerTextMuted} />
      <Text style={styles.searchPlaceholder}>{placeholder}</Text>
      <View style={styles.filterBtn}>
        <Ionicons name="options-outline" size={16} color={c.primary} />
      </View>
    </Pressable>
  );
}

function createSearchStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.customerSurface,
      marginHorizontal: 16,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.isDark ? 0.25 : 0.06,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: 22,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.customerBorder,
    },
    searchPlaceholder: {
      flex: 1,
      fontSize: 13,
      fontFamily: Fonts.brand,
      color: c.customerTextMuted,
    },
    filterBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
