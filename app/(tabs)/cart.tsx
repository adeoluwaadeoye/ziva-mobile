import { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCart } from '@/lib/CartContext';
import { useColors, Spacing } from '@/lib/theme';

export default function CartScreen() {
  const { items, totalItems, totalPrice, removeItem, updateQty, clearCart, loadFromServer } = useCart();

  useFocusEffect(useCallback(() => { loadFromServer(); }, [loadFromServer]));
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const DELIVERY = totalPrice > 0 ? 3500 : 0;
  const grandTotal = totalPrice + DELIVERY;

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bag</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.push('/shop')}>
            <Text style={styles.shopBtnText}>BROWSE COLLECTION</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bag ({totalItems})</Text>
        <Pressable onPress={() => Alert.alert('Clear bag', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₦{totalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>₦{DELIVERY.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₦{grandTotal.toLocaleString()}</Text>
            </View>
            <Pressable
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout')}
            >
              <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
            </Pressable>
            <Text style={styles.secureNote}>🔒 Secure payment via Paystack</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={item.product.image} style={styles.itemImage} contentFit="cover" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemMeta}>{item.selectedSize} · {item.selectedColor}</Text>
              <Text style={styles.itemPrice}>₦{item.product.price.toLocaleString()}</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (item.quantity === 1) {
                      removeItem(item.product.id, item.selectedSize, item.selectedColor);
                    } else {
                      updateQty(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1);
                    }
                  }}
                >
                  <Ionicons name="remove" size={16} color={Colors.black} />
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQty(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={Colors.black} />
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.removeBtn}
              onPress={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
            >
              <Ionicons name="close" size={18} color={Colors.muted} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: C.border,
    },
    title: { fontSize: 20, fontWeight: '300', letterSpacing: 2, color: C.black },
    clearText: { fontSize: 12, color: C.muted, textDecorationLine: 'underline' },
    list: { padding: Spacing.md, gap: 16 },
    cartItem: {
      flexDirection: 'row',
      backgroundColor: C.white,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: C.border,
    },
    itemImage: { width: 80, height: 100 },
    itemInfo: { flex: 1, gap: 4 },
    itemName: { fontSize: 13, color: C.black, lineHeight: 18 },
    itemMeta: { fontSize: 11, color: C.muted },
    itemPrice: { fontSize: 14, fontWeight: '600', color: C.black, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    qtyBtn: {
      width: 28, height: 28,
      borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    qtyValue: { fontSize: 14, fontWeight: '500', color: C.black, minWidth: 20, textAlign: 'center' },
    removeBtn: { padding: 4 },
    summary: {
      marginTop: 8,
      backgroundColor: C.white,
      borderWidth: 1, borderColor: C.border,
      padding: Spacing.md, gap: 12,
    },
    summaryTitle: { fontSize: 14, fontWeight: '600', color: C.black, letterSpacing: 0.5, marginBottom: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 13, color: C.muted },
    summaryValue: { fontSize: 13, color: C.black },
    summaryTotal: { borderTopWidth: 1, borderColor: C.border, paddingTop: 12, marginTop: 4 },
    totalLabel: { fontSize: 15, fontWeight: '600', color: C.black },
    totalValue: { fontSize: 15, fontWeight: '700', color: C.black },
    checkoutBtn: {
      backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    },
    checkoutText: { color: C.cream, fontSize: 13, letterSpacing: 2, fontWeight: '600' },
    secureNote: { textAlign: 'center', fontSize: 11, color: C.muted },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.xl },
    emptyTitle: { fontSize: 18, fontWeight: '400', color: C.black, marginTop: 8 },
    emptySubtitle: { fontSize: 13, color: C.muted },
    shopBtn: {
      borderWidth: 1, borderColor: C.black,
      paddingHorizontal: 24, paddingVertical: 12, marginTop: 12,
    },
    shopBtnText: { fontSize: 12, letterSpacing: 2, color: C.black, fontWeight: '600' },
  });
}
