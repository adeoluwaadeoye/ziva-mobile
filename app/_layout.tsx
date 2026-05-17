import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/AuthContext';
import { ProductsProvider } from '@/lib/ProductsContext';
import { CartProvider } from '@/lib/CartContext';
import { WishlistProvider } from '@/lib/WishlistContext';
import { OrderProvider } from '@/lib/OrderContext';
import { UserDataProvider } from '@/lib/UserDataContext';
import BackButton from '@/components/BackButton';
import { useColors } from '@/lib/theme';

export default function RootLayout() {
  const Colors = useColors();

  const ACCOUNT_SCREEN = {
    headerShown: true,
    headerStyle: { backgroundColor: Colors.cream },
    headerShadowVisible: false,
    headerTintColor: Colors.black,
    headerBackVisible: false,
    headerTitleStyle: { fontWeight: '400' as const, fontSize: 13 },
    headerLeft: () => <BackButton />,
  };

  return (
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <WishlistProvider>
            <OrderProvider>
              <UserDataProvider>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  headerTintColor: Colors.black,
                  headerBackTitle: '',
                  headerTitleStyle: { fontWeight: '400', fontSize: 13 },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="support" options={{ headerShown: false }} />
                <Stack.Screen name="admin" />
                <Stack.Screen
                  name="product/[id]"
                  options={{
                    headerShown: true,
                    headerTitle: '',
                    headerStyle: { backgroundColor: Colors.cream },
                    headerShadowVisible: false,
                    headerTintColor: Colors.black,
                    headerBackVisible: false,
                    headerLeft: () => <BackButton />,
                  }}
                />
                <Stack.Screen name="checkout"      options={{ ...ACCOUNT_SCREEN, title: 'CHECKOUT' }} />
                <Stack.Screen name="orders"        options={{ ...ACCOUNT_SCREEN, title: 'MY ORDERS' }} />
                <Stack.Screen name="wishlist"      options={{ ...ACCOUNT_SCREEN, title: 'MY WISHLIST' }} />
                <Stack.Screen name="measurements"  options={{ ...ACCOUNT_SCREEN, title: 'MY MEASUREMENTS' }} />
                <Stack.Screen name="addresses"     options={{ ...ACCOUNT_SCREEN, title: 'DELIVERY ADDRESSES' }} />
                <Stack.Screen name="notifications" options={{ ...ACCOUNT_SCREEN, title: 'NOTIFICATIONS' }} />
                <Stack.Screen name="privacy"       options={{ ...ACCOUNT_SCREEN, title: 'PRIVACY & SECURITY' }} />
              </Stack>
              </UserDataProvider>
            </OrderProvider>
          </WishlistProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
