import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { styles } from '@/components/atoms/Text/Text.styles';

interface HeadingProps extends RNTextProps {
  level?: 1 | 2 | 3 | 4;
}

export default function Heading({ level = 1, style, children, ...props }: HeadingProps) {
  return (
    <RNText style={[styles.heading, styles[`h${level}`], style]} {...props}>
      {children}
    </RNText>
  );
}
