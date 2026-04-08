import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export interface RestaurantFilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function RestaurantFilterPill({ label, active, onPress }: RestaurantFilterPillProps) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  text: {
    fontFamily: Fonts.brandBold,
    fontSize: 13,
    color: Colors.muted,
  },
  textActive: {
    color: '#fff',
  },
});
