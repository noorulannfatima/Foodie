import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function Loader({ size = 'large', color = BRAND_RED }: LoaderProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
