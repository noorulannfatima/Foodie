import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/components/atoms/Badge/Badge.styles';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export default function Badge({ text, variant = 'primary' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
