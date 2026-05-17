import { Stack } from 'expo-router';
import { useColors } from '@/lib/theme';
import BackButton from '@/components/BackButton';

export default function SupportLayout() {
  const Colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.black,
        headerTitleStyle: { fontWeight: '400' as const, fontSize: 13 },
        headerShadowVisible: false,
        headerBackVisible: false,
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'HELP & SUPPORT' }} />
      <Stack.Screen name="chat"  options={{ title: 'LIVE CHAT' }} />
    </Stack>
  );
}
