import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/components/atoms/Checkbox/Checkbox.styles';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function Checkbox({ checked, onPress, disabled = false }: CheckboxProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.container}>
      <View style={[styles.checkbox, checked && styles.checked, disabled && styles.disabled]}>
        {checked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
    </Pressable>
  );
}
