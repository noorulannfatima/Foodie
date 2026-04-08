import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

export interface AddMenuItemCtaProps {
  onPress: () => void;
}

export default function AddMenuItemCta({ onPress }: AddMenuItemCtaProps) {
  return (
    <TouchableOpacity style={styles.addItemBtn} onPress={onPress}>
      <Ionicons name="add" size={20} color="#fff" />
      <Text style={styles.addItemBtnText}>ADD NEW ITEM</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  addItemBtnText: {
    fontFamily: Fonts.brandBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.5,
  },
});
