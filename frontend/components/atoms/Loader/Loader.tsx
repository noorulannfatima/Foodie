import React from 'react';
import { View, ActivityIndicator } from 'react-native';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export default function Loader({ size = 'large', color = '#FF6B6B' }: LoaderProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
