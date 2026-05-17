import { useMemo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/lib/theme';
import { Product } from '@/lib/products';
import { useWishlist } from '@/lib/WishlistContext';

interface Props {
  product: Product;
  width?: number;
  style?: ViewStyle;
}

export default function ProductCard({ product, width, style }: Props) {
  const router = useRouter();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  function goToProduct() {
    router.push({ pathname: '/product/[id]', params: { id: product.id } });
  }

  return (
    <Pressable
      style={[styles.card, width ? { width } : { flex: 1 }, style]}
      onPress={goToProduct}
    >
      <View style={styles.imageWrapper}>
        <Image source={product.image} style={styles.image} contentFit="cover" transition={200} />

        {product.isNew && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        {product.isSale && (
          <View style={[styles.badge, styles.saleBadge]}>
            <Text style={styles.badgeText}>SALE</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}

        <Pressable style={styles.wishBtn} onPress={() => toggle(product)} hitSlop={8}>
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={17}
            color={wishlisted ? '#EF4444' : '#FFFFFF'}
          />
        </Pressable>

        <View style={styles.actionBar}>
          <Pressable style={styles.quickAddBtn} onPress={goToProduct}>
            <Text style={styles.quickAddText}>+ QUICK ADD</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>₦{product.originalPrice.toLocaleString()}</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>{product.rating} ({product.reviewCount})</Text>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: { backgroundColor: C.white, marginBottom: 16 },
    imageWrapper: { position: 'relative', aspectRatio: 3 / 4, backgroundColor: C.border },
    image: { width: '100%', height: '100%' },
    badge: {
      position: 'absolute', top: 8, left: 8,
      backgroundColor: '#1C1C1C',
      paddingHorizontal: 6, paddingVertical: 2,
    },
    saleBadge: { backgroundColor: '#DC2626' },
    badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    wishBtn: {
      position: 'absolute', top: 8, right: 8,
      backgroundColor: 'rgba(0,0,0,0.38)',
      borderRadius: 20, padding: 6,
    },
    soldOutOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center',
    },
    soldOutText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
    actionBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.68)',
    },
    quickAddBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
    quickAddText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
    info: { paddingTop: 10, paddingHorizontal: 4, gap: 4 },
    name: { fontSize: 13, color: C.black, lineHeight: 18 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    price: { fontSize: 14, fontWeight: '600', color: C.black },
    originalPrice: { fontSize: 12, color: C.muted, textDecorationLine: 'line-through' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    star: { fontSize: 11, color: '#D97706' },
    ratingText: { fontSize: 11, color: C.muted },
  });
}
