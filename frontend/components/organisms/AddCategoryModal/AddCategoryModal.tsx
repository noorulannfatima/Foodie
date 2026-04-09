import { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface AddCategoryModalProps {
  categoryName: string;
  onChangeCategoryName: (value: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}

export default function AddCategoryModal({
  categoryName,
  onChangeCategoryName,
  onCancel,
  onAdd,
}: AddCategoryModalProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category name"
          placeholderTextColor={c.muted}
          value={categoryName}
          onChangeText={onChangeCategoryName}
          autoFocus
        />
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={onAdd}>
            <Text style={styles.saveText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    content: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 340,
      borderWidth: c.isDark ? 1 : 0,
      borderColor: c.border,
    },
    title: {
      fontFamily: Fonts.brandBlack,
      fontSize: 20,
      color: c.text,
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: Fonts.brand,
      fontSize: 15,
      color: c.text,
      marginBottom: 16,
      backgroundColor: c.isDark ? c.screenBackground : undefined,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      alignItems: 'center',
    },
    cancel: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: c.muted,
    },
    saveBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    saveText: {
      fontFamily: Fonts.brandBold,
      fontSize: 14,
      color: '#fff',
    },
  });
}
