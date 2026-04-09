import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useAppThemeColors } from '@/constants/theme';

export default function RestaurantLayout() {
  const c = useAppThemeColors();

  return (
    <View style={[styles.flex, { backgroundColor: c.screenBackground }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.screenBackground },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
