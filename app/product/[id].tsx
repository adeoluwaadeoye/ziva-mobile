import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/lib/ProductsContext';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/lib/WishlistContext';
import { useCart } from '@/lib/CartContext';
import { useColors, Spacing } from '@/lib/theme';
import { Toast, useToast } from '@/components/Toast';
import { AddedToBagSheet } from '@/components/AddedToBagSheet';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, items: cartItems } = useCart();
  const { width } = useWindowDimensions();
  const { getById, getRelated } = useProducts();
  const product = getById(id);
  const related = product ? getRelated(product) : [];
  const { isWishlisted, toggle } = useWishlist();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors, width), [Colors, width]);
  const { toast, show: showToast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Product not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isInCart = !!selectedSize && !!selectedColor &&
    cartItems.some((i) => i.product.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor);

  const handleAddToCart = () => {
    if (!selectedSize) { showToast('Please choose a size before adding to bag.'); return; }
    if (!selectedColor) { showToast('Please choose a colour before adding to bag.'); return; }
    if (isInCart) return;
    addItem({ product, quantity: 1, selectedSize, selectedColor });
    setSheetVisible(true);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Image source={product.images[selectedImage]} style={{ width, height: width * 1.2 }} contentFit="cover" />
          <Pressable style={styles.wishlistBtn} onPress={() => product && toggle(product)}>
            <Ionicons name={isWishlisted(product.id) ? 'heart' : 'heart-outline'} size={22} color={isWishlisted(product.id) ? '#EF4444' : '#FFFFFF'} />
          </Pressable>
          {product.isNew && <View style={styles.imgBadge}><Text style={styles.imgBadgeText}>NEW</Text></View>}
          {discount && <View style={[styles.imgBadge, styles.saleBadge]}><Text style={styles.imgBadgeText}>-{discount}%</Text></View>}
          {product.images.length > 1 && (
            <FlatList
              data={product.images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.thumbRow}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => setSelectedImage(index)}>
                  <Image source={item} style={[styles.thumb, selectedImage === index && styles.thumbActive]} contentFit="cover" />
                </Pressable>
              )}
            />
          )}
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.category}>{product.category.toUpperCase()}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
            {product.originalPrice && <Text style={styles.originalPrice}>₦{product.originalPrice.toLocaleString()}</Text>}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}</Text>
            <Text style={styles.ratingText}>{product.rating} ({product.reviewCount} reviews)</Text>
          </View>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        <View style={styles.selectBlock}>
          <Text style={styles.selectTitle}>Size</Text>
          <View style={styles.optionRow}>
            {product.sizes.map((size) => (
              <Pressable key={size} style={[styles.optionChip, selectedSize === size && styles.optionChipActive]} onPress={() => setSelectedSize(size)}>
                <Text style={[styles.optionText, selectedSize === size && styles.optionTextActive]}>{size}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.selectBlock}>
          <Text style={styles.selectTitle}>Colour</Text>
          <View style={styles.optionRow}>
            {product.colors.map((color) => (
              <Pressable key={color} style={[styles.optionChip, selectedColor === color && styles.optionChipActive]} onPress={() => setSelectedColor(color)}>
                <Text style={[styles.optionText, selectedColor === color && styles.optionTextActive]}>{color}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.deliveryBlock}>
          <View style={styles.deliveryRow}><Ionicons name="car-outline" size={16} color={Colors.muted} /><Text style={styles.deliveryText}>Delivery within 3–5 business days</Text></View>
          <View style={styles.deliveryRow}><Ionicons name="return-up-back-outline" size={16} color={Colors.muted} /><Text style={styles.deliveryText}>Free returns within 14 days</Text></View>
          <View style={styles.deliveryRow}><Ionicons name="cut-outline" size={16} color={Colors.muted} /><Text style={styles.deliveryText}>Custom tailoring available on request</Text></View>
        </View>

        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>YOU MAY ALSO LIKE</Text>
            <FlatList
              data={related}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.relatedRow}
              renderItem={({ item }) => <ProductCard product={item} width={150} />}
            />
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.stickyBar}>
        {product.inStock === false ? (
          <View style={styles.soldOutBar}>
            <Text style={styles.soldOutBarText}>SOLD OUT</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.addBtn, isInCart && styles.addBtnInCart]}
            onPress={handleAddToCart}
            disabled={isInCart}
          >
            <Ionicons name={isInCart ? 'bag-check-outline' : 'bag-outline'} size={18} color={Colors.cream} />
            <Text style={styles.addBtnText}>{isInCart ? 'IN BAG' : 'ADD TO BAG'}</Text>
          </Pressable>
        )}
      </View>

      <Toast toast={toast} />

      <AddedToBagSheet
        visible={sheetVisible}
        productName={product.name}
        productImage={product.images[selectedImage]}
        selectedSize={selectedSize}
        selectedColor={selectedColor}
        price={product.price}
        onDismiss={() => setSheetVisible(false)}
        onViewBag={() => { setSheetVisible(false); router.push('/cart'); }}
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>, width: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    notFoundText: { fontSize: 16, color: C.muted },
    backLink: { fontSize: 14, color: C.black, textDecorationLine: 'underline' },
    wishlistBtn: { position: 'absolute', top: 16, right: 16, width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    imgBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#1C1C1C', paddingHorizontal: 8, paddingVertical: 3 },
    saleBadge: { backgroundColor: '#DC2626' },
    imgBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    thumbRow: { paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8 },
    thumb: { width: 60, height: 75, borderWidth: 1, borderColor: C.border },
    thumbActive: { borderColor: C.black, borderWidth: 2 },
    infoBlock: { padding: Spacing.md, gap: 8, borderBottomWidth: 1, borderColor: C.border },
    category: { fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: '600' },
    name: { fontSize: 22, fontWeight: '300', color: C.black, lineHeight: 30 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    price: { fontSize: 20, fontWeight: '600', color: C.black },
    originalPrice: { fontSize: 14, color: C.muted, textDecorationLine: 'line-through' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stars: { fontSize: 13, color: '#D97706' },
    ratingText: { fontSize: 12, color: C.muted },
    description: { fontSize: 14, color: C.muted, lineHeight: 22, marginTop: 4 },
    selectBlock: { padding: Spacing.md, borderBottomWidth: 1, borderColor: C.border, gap: 12 },
    selectTitle: { fontSize: 13, fontWeight: '600', color: C.black, letterSpacing: 0.5 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionChip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.white },
    optionChipActive: { borderColor: C.black, backgroundColor: C.black },
    optionText: { fontSize: 12, color: C.muted },
    optionTextActive: { color: C.cream, fontWeight: '600' },
    deliveryBlock: { padding: Spacing.md, gap: 10 },
    deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deliveryText: { fontSize: 13, color: C.muted },
    relatedSection: { paddingTop: Spacing.md, borderTopWidth: 1, borderColor: C.border },
    relatedTitle: { fontSize: 10, letterSpacing: 2.5, fontWeight: '700', color: C.muted, paddingHorizontal: Spacing.md, marginBottom: 12 },
    relatedRow: { paddingHorizontal: Spacing.md, gap: 10, paddingBottom: 4 },
    stickyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, backgroundColor: C.cream, borderTopWidth: 1, borderColor: C.border },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.black, paddingVertical: 16 },
    addBtnInCart: { backgroundColor: C.muted },
    addBtnText: { color: C.cream, fontSize: 13, letterSpacing: 2, fontWeight: '600' },
    soldOutBar: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.border, paddingVertical: 16 },
    soldOutBarText: { fontSize: 13, letterSpacing: 2, fontWeight: '700', color: C.muted },
  });
}
