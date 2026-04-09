import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fonts, useAppThemeColors } from '@/constants/theme';

export default function CustomerHomeHeader() {
  const c = useAppThemeColors(); // customer nav bar tracks global appearance toggle
  const styles = useMemo(() => createHeaderStyles(c), [c]);

  return (
    <View style={styles.header}>
      <Pressable style={styles.menuBtn}>
        <Ionicons name="menu" size={22} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.headerLogo}>FOODIE</Text>
      <Pressable style={styles.avatarBtn} onPress={() => router.push('/(customer)/(tabs)/profile')}>
        <Ionicons name="person" size={18} color={c.navBar} />
      </Pressable>
    </View>
  );
}

function createHeaderStyles(c: ReturnType<typeof useAppThemeColors>) {
  return StyleSheet.create({
    header: {
      backgroundColor: c.navBar,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
      paddingTop: Platform.OS === 'android' ? 8 : 4,
    },
    menuBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLogo: {
      fontSize: 18,
      fontFamily: Fonts.brandBlack,
      color: '#FFFFFF',
      letterSpacing: 3,
    },
    avatarBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.customerTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
