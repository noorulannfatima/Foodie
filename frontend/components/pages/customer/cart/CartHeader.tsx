import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { NAV_COLOR } from './constants';

export interface CartHeaderProps {
  showClearAction?: boolean;
  onClearCart?: () => void;
}

export default function CartHeader({ showClearAction, onClearCart }: CartHeaderProps) {
  return (
    <View style={styles.header}>
      <Ionicons name="menu" size={22} color="#fff" />
      <Text style={styles.headerLogo}>FOODIE</Text>
      {showClearAction ? (
        <TouchableOpacity onPress={onClearCart}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: NAV_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 4,
  },
  headerLogo: {
    fontSize: 18,
    fontFamily: Fonts.brandBlack,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  headerSpacer: {
    width: 36,
  },
});
