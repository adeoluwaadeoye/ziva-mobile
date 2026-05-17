import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useColors } from '@/lib/theme';
import { useWishlist } from '@/lib/WishlistContext';
import ProductCard from '@/components/ProductCard';

const GAP = 8;
const H_PAD = 8;

export default function WishlistScreen() {
  const { items, loadFromServer } = useWishlist();

  useFocusEffect(useCallback(() => { loadFromServer(); }, [loadFromServer]));
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PAD * 2 - GAP) / 2;
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>Tap the heart icon on any product to save it here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: GAP }}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    grid: { padding: H_PAD, gap: GAP, paddingBottom: 32 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyTitle: { fontSize: 16, fontWeight: '500', color: C.black },
    emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  });
}
