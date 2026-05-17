import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/lib/CartContext';
import { useColors } from '@/lib/theme';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name={focused ? 'bag' : 'bag-outline'} size={22} color={color} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const Colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <CartTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#1C1C1C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
});
