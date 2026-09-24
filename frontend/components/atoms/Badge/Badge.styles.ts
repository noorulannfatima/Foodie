import { StyleSheet } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

export const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: BRAND_RED,
  },
  success: {
    backgroundColor: '#51CF66',
  },
  warning: {
    backgroundColor: '#FFA94D',
  },
  danger: {
    backgroundColor: BRAND_RED,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
