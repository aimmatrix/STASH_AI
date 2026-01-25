import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css"; // NativeWind
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login'; // Check if in login route
    // Note: Our login file is at app/login.tsx, so segment is ["login"]
    // Tabs are at app/(tabs)/..., so segment is ["(tabs)", ...]

    if (!session && segments[0] !== 'login') {
      // Redirect to login if not authenticated and not already on login page
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      // Redirect to dashboard if authenticated and on login page
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Load standard fonts if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded || !error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
