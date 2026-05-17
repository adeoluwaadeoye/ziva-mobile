import { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useColors, Spacing } from '@/lib/theme';
import { useOrders } from '@/lib/OrderContext';
import { tokenStore } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';

const STATUS: Record<string, { label: string; color: string }> = {
  processing:       { label: 'Processing',       color: '#D97706' },
  paid:             { label: 'Paid',             color: '#059669' },
  shipped:          { label: 'Shipped',           color: '#3B82F6' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#8B5CF6' },
  delivered:        { label: 'Delivered',         color: '#22C55E' },
  cancelled:        { label: 'Cancelled',         color: '#EF4444' },
};

export default function OrdersScreen() {
  const { orders, loadingOrders, refreshOrders } = useOrders();
  const [downloading, setDownloading] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refreshOrders(); }, [refreshOrders]));
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const downloadInvoice = useCallback(async (orderId: string) => {
    setDownloading(orderId);
    try {
      const token = await tokenStore.getSession();
      const dest = new File(Paths.cache, `ZIVA-Invoice-${orderId}.pdf`);
      const downloaded = await File.downloadFileAsync(
        `${API_BASE_URL}/api/user/orders/${orderId}/invoice`,
        dest,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined, idempotent: true },
      );
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloaded.uri, { mimeType: 'application/pdf', dialogTitle: `ZIVA Invoice ${orderId}` });
      } else {
        Alert.alert('Invoice saved', `Saved to: ${downloaded.uri}`);
      }
    } catch {
      Alert.alert('Download failed', 'Could not download the invoice. Please try again.');
    } finally {
      setDownloading(null);
    }
  }, []);

  if (orders.length === 0 && !loadingOrders) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={loadingOrders} onRefresh={refreshOrders} tintColor={Colors.muted} />}
        >
          <Ionicons name="receipt-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here once you place an order.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loadingOrders} onRefresh={refreshOrders} tintColor={Colors.muted} />}
      >
        {orders.map((order) => {
          const status = STATUS[order.status] ?? { label: order.status ?? 'Unknown', color: '#6B7280' };
          const isDownloading = downloading === order.id;
          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.itemsList}>
                {order.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    {item.image
                      ? <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" />
                      : <View style={[styles.itemImage, styles.itemImagePlaceholder]}><Ionicons name="image-outline" size={20} color={Colors.border} /></View>
                    }
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemMeta}>{item.size} · {item.color}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                  <Ionicons name="location-outline" size={13} color={Colors.muted} />
                  <Text style={styles.footerAddress} numberOfLines={1}>{order.address}</Text>
                </View>
                <Text style={styles.total}>₦{order.total.toLocaleString()}</Text>
              </View>
              <Pressable
                style={[styles.invoiceBtn, isDownloading && styles.invoiceBtnDisabled]}
                onPress={() => downloadInvoice(order.id)}
                disabled={isDownloading}
              >
                {isDownloading
                  ? <ActivityIndicator size="small" color={Colors.muted} />
                  : <Ionicons name="download-outline" size={13} color={Colors.muted} />
                }
                <Text style={styles.invoiceBtnText}>
                  {isDownloading ? 'Downloading…' : 'Download Invoice'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 32 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
    emptyTitle: { fontSize: 16, fontWeight: '500', color: C.black },
    emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
    card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: Spacing.md, borderBottomWidth: 1, borderColor: C.border,
    },
    orderId: { fontSize: 12, fontWeight: '700', color: C.black, letterSpacing: 0.5 },
    orderDate: { fontSize: 11, color: C.muted, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    itemsList: { padding: Spacing.md, gap: 14 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemImage: { width: 56, height: 70, borderWidth: 1, borderColor: C.border },
    itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
    itemInfo: { flex: 1, gap: 2 },
    itemName: { fontSize: 13, color: C.black, lineHeight: 18 },
    itemMeta: { fontSize: 11, color: C.muted },
    itemQty: { fontSize: 11, color: C.muted },
    itemPrice: { fontSize: 13, fontWeight: '600', color: C.black },
    cardFooter: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: Spacing.md, borderTopWidth: 1, borderColor: C.border,
      backgroundColor: C.cream,
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, marginRight: 12 },
    footerAddress: { fontSize: 11, color: C.muted, flex: 1 },
    total: { fontSize: 14, fontWeight: '700', color: C.black },
    invoiceBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 10,
      borderTopWidth: 1, borderColor: C.border,
    },
    invoiceBtnDisabled: { opacity: 0.5 },
    invoiceBtnText: { fontSize: 11, color: C.muted },
  });
}
