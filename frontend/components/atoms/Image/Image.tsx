import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import { ImageProps as ExpoImageProps } from 'expo-image';
import { styles } from '@/components/atoms/Image/Image.styles';

interface ImageProps extends Partial<ExpoImageProps> {
  source: ExpoImageProps['source'];
  aspectRatio?: number;
}

export default function Image({ source, aspectRatio, style, ...props }: ImageProps) {
  return (
    <ExpoImage
      source={source}
      style={[styles.image, aspectRatio !== undefined && { aspectRatio }, style]}
      contentFit="cover"
      {...props}
    />
  );
}
