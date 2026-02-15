import React from 'react';
import { View, Pressable } from 'react-native';
import { styles } from '@/components/atoms/Radio/Radio.styles';

interface RadioProps {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function Radio({ selected, onPress, disabled }: RadioProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.container}>
      <View style={[styles.radio, disabled && styles.disabled]}>
        {selected && <View style={styles.selected} />}
      </View>
    </Pressable>
  );
}
