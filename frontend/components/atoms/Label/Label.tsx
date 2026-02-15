import React from 'react';
import { Text } from 'react-native';
import { styles } from '@/components/atoms/Label/Label.styles';

interface LabelProps {
  text: string;
  required?: boolean;
  error?: boolean;
}

export default function Label({ text, required, error }: LabelProps) {
  return (
    <Text style={[styles.label, error && styles.error]}>
      {text}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}
