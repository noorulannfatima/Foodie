import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

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
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category name"
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 20,
    color: Colors.dark,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: Fonts.brand,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 16,
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
    color: Colors.muted,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
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
