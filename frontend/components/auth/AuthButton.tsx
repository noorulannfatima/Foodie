import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  disabled?: boolean;
}

const ICONS: Record<string, string> = {
  briefcase: '💼',
  person: '👤',
  store: '🏪',
  bike: '🚴',
};

export default function AuthButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
}: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.inner}>
        {icon && <Text style={styles.icon}>{ICONS[icon] ?? icon}</Text>}
        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: 'white',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FF6B6B',
  },
  secondaryText: {
    color: 'white',
  },
  outlineText: {
    color: 'white',
  },
});
