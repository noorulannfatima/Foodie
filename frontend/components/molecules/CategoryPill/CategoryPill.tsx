import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '@/components/molecules/CategoryPill/CategoryPill.styles';

interface CategoryPillProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function CategoryPill({ label, icon, selected, onPress }: CategoryPillProps) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.selected]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}
