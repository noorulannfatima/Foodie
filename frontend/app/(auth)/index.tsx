import { View, Image, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AuthButton from '@/components/auth/AuthButton';
import RoleSelector from '@/components/auth/RoleSelector';

export default function LandingScreen() {
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.logoArea}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <AuthButton
          title="Login"
          onPress={() => router.push('/(auth)/customer/login')}
          variant="primary"
        />

        <AuthButton
          title="Sign Up"
          onPress={() => router.push('/(auth)/customer/signup')}
          variant="primary"
        />

        <AuthButton
          title="Others"
          onPress={() => setShowRoleSheet(true)}
          variant="outline"
        />
      </View>

      <RoleSelector
        visible={showRoleSheet}
        onClose={() => setShowRoleSheet(false)}
        onSelectRole={(role) => {
          setShowRoleSheet(false);
          router.push(`/(auth)/${role}/login`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 70,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
});
