import { StyleSheet } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: BRAND_RED,
    borderColor: BRAND_RED,
  },
  disabled: {
    opacity: 0.5,
  },
});
