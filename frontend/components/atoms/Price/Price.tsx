import React from 'react';
import { Text } from 'react-native';
import { styles } from '@/components/atoms/Price/Price.styles';

interface PriceProps {
  amount: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  strikethrough?: boolean;
}

export default function Price({ amount, currency = '$', size = 'medium', strikethrough }: PriceProps) {
  return (
    <Text style={[styles.price, styles[size], strikethrough && styles.strikethrough]}>
      {currency}{amount.toFixed(2)}
    </Text>
  );
}
