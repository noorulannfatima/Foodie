import { StyleSheet } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

export const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  required: {
    color: BRAND_RED,
  },
  error: {
    color: '#FF6B6B',
  },
});
