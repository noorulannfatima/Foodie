import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function Spinner({ size = 'small', color = '#FF6B6B' }: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} />;
}
