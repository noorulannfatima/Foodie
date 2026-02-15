import React from 'react';
import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/components/atoms/Input/Input.styles';
import { InputProps } from '@/components/atoms/Input/Input.types';

export default function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  leftIcon,
  rightIcon,
  error,
  disabled,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, error && styles.errorContainer, style]}>
      {leftIcon && (
        <Ionicons name={leftIcon} size={20} color="#868E96" style={styles.leftIcon} />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#ADB5BD"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={!disabled}
        style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
        {...props}
      />
      {rightIcon && (
        <Ionicons name={rightIcon} size={20} color="#868E96" style={styles.rightIcon} />
      )}
    </View>
  );
}
