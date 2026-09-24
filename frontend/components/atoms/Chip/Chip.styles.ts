import { StyleSheet } from 'react-native';
import { BRAND_RED } from '@/constants/theme';

export const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F3F5',
    gap: 4,
  },
  selected: {
    backgroundColor: BRAND_RED,
  },
  label: {
    fontSize: 14,
    color: '#495057',
  },
  selectedLabel: {
    color: 'white',
  },
  closeButton: {
    padding: 2,
  },
});
