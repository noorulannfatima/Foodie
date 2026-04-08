import { Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export interface CartScreenHeadingProps {
  restaurantName?: string;
}

export default function CartScreenHeading({ restaurantName }: CartScreenHeadingProps) {
  return (
    <>
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.restaurantLabel}>from {restaurantName ?? '—'}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.brandBlack,
    fontSize: 28,
    color: Colors.dark,
    marginBottom: 4,
  },
  restaurantLabel: {
    fontFamily: Fonts.brand,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 20,
  },
});
