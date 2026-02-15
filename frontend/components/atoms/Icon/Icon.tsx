import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { IconProps } from '@/components/atoms/Icon/Icon.types';

export default function Icon({ name, size = 24, color = '#000', style }: IconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
