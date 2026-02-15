import React from 'react';
import { Image as RNImage, ImageProps as RNImageProps } from 'react-native';
import { styles } from '@/components/atoms/Avatar/Avatar.styles';

interface AvatarProps extends Partial<RNImageProps> {
  source: RNImageProps['source'];
  size?: 'small' | 'medium' | 'large';
}

export default function Avatar({ source, size = 'medium', style, ...props }: AvatarProps) {
  return (
    <RNImage
      source={source}
      style={[styles.avatar, styles[size], style]}
      {...props}
    />
  );
}
