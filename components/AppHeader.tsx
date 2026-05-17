import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing } from '@/lib/theme';
import { useCart } from '@/lib/CartContext';
import ZivaLogo from './ZivaLogo';

export default function AppHeader() {
  const router = useRouter();
  const { totalItems } = useCart();
  const Colors = useColors();
  const scheme = useColorScheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.announce}>
        <Text style={styles.announceText} numberOfLines={1}>
          Free delivery over ₦50,000  ·  Handcrafted in Nigeria
        </Text>
      </View>

      <View style={styles.mainRow}>
        <ZivaLogo variant={scheme === 'dark' ? 'light' : 'dark'} size="sm" />

        <Pressable style={styles.iconBtn} onPress={() => router.push('/cart')}>
          <View>
            <Ionicons name="bag-outline" size={20} color={Colors.black} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: C.cream,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    announce: {
      backgroundColor: '#1C1C1C',
      paddingVertical: 8,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    announceText: {
      color: 'rgba(255,255,255,0.70)',
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: '600',
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
    },
    iconBtn: { padding: 4 },
    badge: {
      position: 'absolute',
      top: -4,
      right: -6,
      backgroundColor: '#EF4444',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  });
}
