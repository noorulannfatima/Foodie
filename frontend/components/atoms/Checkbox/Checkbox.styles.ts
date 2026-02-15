import { StyleSheet } from 'react-native';

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
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  disabled: {
    opacity: 0.5,
  },
});
