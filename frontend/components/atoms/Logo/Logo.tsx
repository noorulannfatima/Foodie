import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '@/components/atoms/Logo/Logo.styles';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ size = 'medium' }: LogoProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.logo, styles[size]]}>🍔</Text>
      <Text style={[styles.text, styles[`${size}Text`]]}>Foodie</Text>
    </View>
  );
}
