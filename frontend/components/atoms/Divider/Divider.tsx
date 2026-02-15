import React from 'react';
import { View } from 'react-native';
import { styles } from '@/components/atoms/Divider/Divider.styles';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
}

export default function Divider({ orientation = 'horizontal', spacing = 16 }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        { margin: spacing },
      ]}
    />
  );
}
