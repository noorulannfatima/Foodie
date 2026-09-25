import React from 'react';
import { Text } from 'react-native';
import { styles } from '@/components/atoms/Price/Price.styles';
import { formatCurrency } from '@/utils/currency';

interface PriceProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  strikethrough?: boolean;
}

export default function Price({ amount, size = 'medium', strikethrough }: PriceProps) {
  return (
    <Text style={[styles.price, styles[size], strikethrough && styles.strikethrough]}>
      {formatCurrency(amount)}
    </Text>
  );
}
