import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { styles } from '@/components/atoms/Button/Button.styles';
import { ButtonProps } from '@/components/atoms/Button/Button.types';
import { BRAND_RED } from '@/constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? BRAND_RED : 'white'} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}
