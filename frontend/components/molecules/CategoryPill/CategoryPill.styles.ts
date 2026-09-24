import { StyleSheet } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

export const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  selected: {
    backgroundColor: BRAND_RED,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  selectedLabel: {
    color: 'white',
  },
});
