import useUserStore from '@/hooks/use-userstore';
import { Redirect, Stack, useSegments } from 'expo-router';
import { Text, View } from 'react-native';

const RootNav = () => {
  const { isGuest, user } = useUserStore();
  const segments = useSegments();
  const isLoading = false; // Replace with actual loading state if needed from store

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Check if we are already in the public group to prevent infinite redirect
  // segments structure typically includes groups: ['(app)', '(public)', ...]
  const inPublicGroup = segments[1] === '(public)';

  if (!user && !isGuest && !inPublicGroup) {
    return <Redirect href="/(public)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(public)" options={{ headerShown: false }} />
    </Stack>
  );
};
export default RootNav;
