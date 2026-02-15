import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { styles } from '@/components/atoms/Text/Text.styles';

interface TextProps extends RNTextProps {
  variant?: 'body' | 'caption' | 'small';
  weight?: 'regular' | 'medium' | 'bold';
}

export default function Text({ variant = 'body', weight = 'regular', style, children, ...props }: TextProps) {
  return (
    <RNText style={[styles.text, styles[variant], styles[weight], style]} {...props}>
      {children}
    </RNText>
  );
}
