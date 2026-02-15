import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { styles } from '@/components/atoms/Text/Text.styles';

interface ParagraphProps extends RNTextProps {}

export default function Paragraph({ style, children, ...props }: ParagraphProps) {
  return (
    <RNText style={[styles.paragraph, style]} {...props}>
      {children}
    </RNText>
  );
}
