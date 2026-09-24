import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function Spinner({ size = 'small', color = BRAND_RED }: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} />;
}
