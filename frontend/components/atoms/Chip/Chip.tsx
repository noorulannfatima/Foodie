import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/components/atoms/Chip/Chip.styles';

interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  selected?: boolean;
}

export default function Chip({ label, onPress, onClose, selected = false }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      {onClose && (
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={16} color={selected ? 'white' : '#666'} />
        </Pressable>
      )}
    </Pressable>
  );
}
