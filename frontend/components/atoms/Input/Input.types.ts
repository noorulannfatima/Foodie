import { TextInputProps, ViewStyle } from 'react-native';

export interface InputProps extends TextInputProps {
  leftIcon?: any;
  rightIcon?: any;
  error?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}
