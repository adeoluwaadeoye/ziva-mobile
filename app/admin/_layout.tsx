import { Stack } from 'expo-router';
import { Colors } from '@/lib/theme';
import BackButton from '@/components/BackButton';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.black },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '400', fontSize: 13 },
        headerBackVisible: false,
        headerLeft: () => <BackButton color={Colors.white} />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ADMIN PANEL' }} />
    </Stack>
  );
}
