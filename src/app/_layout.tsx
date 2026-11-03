import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MobileSessionContext } from '@/lib/session';

export default function RootLayout() {
  return (
    <MobileSessionContext.Provider value={{ token: null, userId: null, email: '', imageUrl: '', tenant: null, setTenant: () => undefined, setProfileImage: async () => '' }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileSessionContext.Provider>
  );
}
