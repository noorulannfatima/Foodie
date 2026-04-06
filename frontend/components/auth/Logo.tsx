import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    width: 200,
    height: 60,
  },
});
