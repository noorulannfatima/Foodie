import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  disabled: {
    opacity: 0.5,
  },
});
