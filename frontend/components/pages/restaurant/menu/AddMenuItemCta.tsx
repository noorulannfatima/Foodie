import { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, useAppThemeColors, type AppColors } from '@/constants/theme';

export interface AddMenuItemCtaProps {
  onPress: () => void;
}

export default function AddMenuItemCta({ onPress }: AddMenuItemCtaProps) {
  const c = useAppThemeColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity style={styles.addItemBtn} onPress={onPress}>
      <Ionicons name="add" size={20} color="#fff" />
      <Text style={styles.addItemBtnText}>ADD NEW ITEM</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    addItemBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.secondary,
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
}
