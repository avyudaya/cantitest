import { AuthProvider } from '@/components/AuthProvider';
import { MusicProvider } from '@/components/MusicProvider';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="album/[id]" options={{ title: 'Album Details' }} />
        </Stack>
      </MusicProvider>
    </AuthProvider>
  );
}