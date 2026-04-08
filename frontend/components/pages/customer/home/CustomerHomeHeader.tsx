import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { NAV_COLOR } from './constants';

export default function CustomerHomeHeader() {
  return (
    <View style={styles.header}>
      <Pressable style={styles.menuBtn}>
        <Ionicons name="menu" size={22} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.headerLogo}>FOODIE</Text>
      <Pressable style={styles.avatarBtn} onPress={() => router.push('/(customer)/(tabs)/profile')}>
        <Ionicons name="person" size={18} color={NAV_COLOR} />
      </Pressable>
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
    backgroundColor: '#FCBF49',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
