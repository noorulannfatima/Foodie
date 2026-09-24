import { StyleSheet } from 'react-native';
import { BRAND_RED, BRAND_RED_TINT } from '@/constants/theme';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selected: {
    borderColor: BRAND_RED,
    backgroundColor: BRAND_RED_TINT,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  address: {
    fontSize: 14,
    color: '#868E96',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
