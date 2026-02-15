import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/components/molecules/FoodCard/FoodCard.styles';

export default function FoodCard() {
  return (
    <View style={styles.container}>
      <Text>FoodCard Component</Text>
    </View>
  );
}
