import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AuthButton from '@/components/auth/AuthButton';
import RoleSelector from '@/components/auth/RoleSelector';
import Logo from '@/components/auth/Logo';

export default function LandingScreen() {
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  return (
    <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.container}>
      <Logo />
      
      <View style={styles.content}>
        <Text style={styles.title}>Foodie</Text>
        <Text style={styles.subtitle}>Delicious food at your doorstep</Text>
      </View>

      <View style={styles.buttonContainer}>
        <AuthButton 
          title="Login as Customer" 
          onPress={() => router.push('/(auth)/customer/login')}
          variant="primary"
        />
        
        <AuthButton 
          title="Sign Up as Customer" 
          onPress={() => router.push('/(auth)/customer/signup')}
          variant="secondary"
        />

        <AuthButton 
          title="Business Login" 
          onPress={() => setShowRoleSheet(true)}
          variant="outline"
          icon="briefcase"
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
});