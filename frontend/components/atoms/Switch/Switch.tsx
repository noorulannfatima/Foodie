import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { styles } from '@/components/atoms/Switch/Switch.styles';
import { BRAND_RED } from '@/constants/theme';

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
      trackColor={{ false: '#E9ECEF', true: BRAND_RED }}
      thumbColor="#FFFFFF"
    />
  );
}
