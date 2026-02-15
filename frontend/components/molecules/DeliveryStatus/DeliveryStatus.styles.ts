import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  time: {
    fontSize: 14,
    color: '#868E96',
  },
});
