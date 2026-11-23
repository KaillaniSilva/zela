import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../lib/AppContext';
import Toast from '../components/Toast';
import { colors } from '../lib/theme';
import { useReducedMotion } from '../lib/motion';

export default function RootLayout() {
  const reduced = useReducedMotion();
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
            // Transição lateral indica "aprofundar"; desligada se o usuário reduz movimento
            animation: reduced ? 'none' : 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="relato/[id]" options={{ title: 'Andamento do relato', headerBackTitle: 'Voltar' }} />
        </Stack>
        <Toast />
      </AppProvider>
    </SafeAreaProvider>
  );
}
