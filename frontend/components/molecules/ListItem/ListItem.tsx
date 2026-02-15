import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/components/molecules/ListItem/ListItem.styles';

export default function ListItem() {
  return (
    <View style={styles.container}>
      <Text>ListItem Component</Text>
    </View>
  );
}
