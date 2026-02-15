import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { styles } from '@/components/atoms/Switch/Switch.styles';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function Switch({ value, onValueChange, disabled }: SwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: '#E9ECEF', true: '#FFB3B3' }}
      thumbColor={value ? '#FF6B6B' : '#F8F9FA'}
    />
  );
}
