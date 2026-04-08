import { Text, View, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export type MenuItemTagVariant = 'success' | 'danger';

export interface MenuItemTagProps {
  label: string;
  variant?: MenuItemTagVariant;
}

export default function MenuItemTag({ label, variant = 'success' }: MenuItemTagProps) {
  return (
    <View style={[styles.tag, variant === 'success' ? styles.tagSuccess : styles.tagDanger]}>
      <Text style={[styles.tagText, variant === 'success' ? styles.tagTextSuccess : styles.tagTextDanger]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagSuccess: {
    backgroundColor: '#DCFCE7',
  },
  tagDanger: {
    backgroundColor: '#FEE2E2',
  },
  tagText: {
    fontFamily: Fonts.brandBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tagTextSuccess: {
    color: '#16A34A',
  },
  tagTextDanger: {
    color: '#EF4444',
  },
});
