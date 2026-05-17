import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  TextInput, Modal, ActivityIndicator, useWindowDimensions, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/AuthContext';
import { useColors, Spacing } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { api, ApiProduct, ApiOrder, AdminStats, ApiChat, ApiChatMessage } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';

const STATUS_COLORS: Record<string, string> = {
  delivered: '#22C55E', paid: '#F59E0B', processing: '#F59E0B',
  shipped: '#3B82F6', cancelled: '#EF4444', out_for_delivery: '#8B5CF6',
};

const ALL_STATUSES = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const EMPTY_PRODUCT: Partial<ApiProduct> = {
  name: '', price: 0, gender: 'women', category: 'ankara',
  description: '', sizes: [], colors: [], images: [], image: '',
  isNew: false, isSale: false, isFeatured: false, inStock: true,
};

const SORT_OPTIONS = [
  { key: 'name', label: 'Name A–Z' },
  { key: 'price-asc', label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
];

function fixUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

type Tab = 'overview' | 'orders' | 'products' | 'support';

export default function AdminDashboard() {
  const { adminLogout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors, width), [Colors, width]);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [deviceStats, setDeviceStats] = useState<{ mobile: number; tablet: number; desktop: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Products tab state
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ApiProduct>>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodGender, setProdGender] = useState<'' | 'women' | 'men'>('');
  const [prodStock, setProdStock] = useState<'' | 'in' | 'out'>('');
  const [prodSort, setProdSort] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [prodView, setProdView] = useState<'list' | 'grid'>('list');
  const [sortOpen, setSortOpen] = useState(false);
  const [togglingStockId, setTogglingStockId] = useState<string | null>(null);

  // Support/chat state
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [openChat, setOpenChat] = useState<ApiChat | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (prodGender) list = list.filter((p) => p.gender === prodGender);
    if (prodStock === 'in') list = list.filter((p) => p.inStock);
    if (prodStock === 'out') list = list.filter((p) => !p.inStock);
    switch (prodSort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      default: list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, prodSearch, prodGender, prodStock, prodSort]);

  const totalChatUnread = useMemo(() => chats.reduce((s, c) => s + (c.unreadAdmin ?? 0), 0), [chats]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes, dRes] = await Promise.all([
        api.admin.getProducts(),
        api.admin.getOrders(),
        api.admin.getDeviceStats().catch(() => ({ totals: null })),
      ]);
      setProducts(pRes.products);
      setOrders(oRes.orders);
      setStats(oRes.stats);
      if (dRes.totals) setDeviceStats(dRes.totals);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await api.admin.getChats();
      setChats(res.chats);
    } catch {
      // silent
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'support') loadChats();
  }, [activeTab, loadChats]);

  const openChatThread = async (chat: ApiChat) => {
    setChatLoading(true);
    setOpenChat(chat);
    try {
      const res = await api.admin.getChat(chat.id);
      setOpenChat(res.chat);
      setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unreadAdmin: 0 } : c));
    } catch {
      // keep what we have
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!openChat || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.admin.replyToChat(openChat.id, replyText.trim());
      setOpenChat((prev) => prev ? { ...prev, messages: [...prev.messages, res.message as ApiChatMessage] } : prev);
      setReplyText('');
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleChatStatus = async (chat: ApiChat) => {
    const newStatus = chat.status === 'open' ? 'closed' : 'open';
    try {
      await api.admin.patchChat(chat.id, { status: newStatus });
      setOpenChat((prev) => prev ? { ...prev, status: newStatus } : prev);
      setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, status: newStatus } : c));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openAddProduct = () => { setEditingProduct({ ...EMPTY_PRODUCT }); setProductModal(true); };
  const openEditProduct = (p: ApiProduct) => { setEditingProduct({ ...p }); setProductModal(true); };

  const handleSaveProduct = async () => {
    if (!editingProduct.name?.trim() || !editingProduct.price) {
      Alert.alert('Missing fields', 'Name and price are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingProduct.id) {
        await api.admin.updateProduct(editingProduct.id, editingProduct);
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, ...editingProduct } as ApiProduct : p));
      } else {
        const { product } = await api.admin.addProduct({
          ...editingProduct,
          images: editingProduct.image ? [editingProduct.image] : [],
        });
        setProducts((prev) => [product, ...prev]);
      }
      setProductModal(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (p: ApiProduct) => {
    Alert.alert('Delete Product', `Delete "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.admin.deleteProduct(p.id);
            setProducts((prev) => prev.filter((x) => x.id !== p.id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleToggleStock = async (p: ApiProduct) => {
    setTogglingStockId(p.id);
    try {
      await api.admin.updateProduct(p.id, { inStock: !p.inStock });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, inStock: !p.inStock } : x));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTogglingStockId(null);
    }
  };

  const handleUpdateOrderStatus = (order: ApiOrder) => {
    Alert.alert('Update Status', `Order ${order.id}`, ALL_STATUSES.map((s) => ({
      text: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      onPress: async () => {
        try {
          await api.admin.updateOrderStatus(order.id, s);
          setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: s } : o));
        } catch (e: any) { Alert.alert('Error', e.message); }
      },
    })));
  };

  const handleDownloadInvoice = async (order: ApiOrder) => {
    try {
      const url = await api.admin.getInvoiceUrl(order.id);
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open invoice.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Exit Admin', 'Remove admin access from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => { adminLogout(); router.replace('/(tabs)/account'); } },
    ]);
  };

  const gridCardWidth = (width - Spacing.md * 2 - 8) / 2;

  // ── Chat thread overlay ─────────────────────────────────────────────────────
  if (openChat) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <Pressable style={styles.chatBack} onPress={() => setOpenChat(null)}>
            <Ionicons name="arrow-back" size={20} color={Colors.black} />
          </Pressable>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{openChat.customerName}</Text>
            <Text style={styles.chatHeaderEmail}>{openChat.customerEmail}</Text>
          </View>
          <Pressable
            style={[styles.chatStatusBtn, openChat.status === 'open' ? styles.chatStatusOpen : styles.chatStatusClosed]}
            onPress={() => handleToggleChatStatus(openChat)}
          >
            <Text style={styles.chatStatusBtnText}>{openChat.status === 'open' ? 'OPEN' : 'CLOSED'}</Text>
          </Pressable>
        </View>

        {chatLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color={Colors.black} /></View>
        ) : (
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
          >
            {openChat.messages.map((msg, i) => (
              <View key={i} style={[styles.bubble, msg.from === 'admin' ? styles.bubbleAdmin : styles.bubbleCustomer]}>
                <Text style={[styles.bubbleText, msg.from === 'admin' ? styles.bubbleTextAdmin : styles.bubbleTextCustomer]}>
                  {msg.text}
                </Text>
                <Text style={styles.bubbleTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {openChat.status === 'open' && (
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type a reply…"
              placeholderTextColor={Colors.muted}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <Pressable style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.4 }]} onPress={handleSendReply} disabled={!replyText.trim() || sending}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={16} color="#FFFFFF" />}
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabBar}>
        {(['overview', 'orders', 'products', 'support'] as const).map((tab) => (
          <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <View style={styles.tabInner}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'support' ? 'CHAT' : tab.toUpperCase()}
              </Text>
              {tab === 'support' && totalChatUnread > 0 && (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{totalChatUnread}</Text></View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color={Colors.black} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <>
              <Text style={styles.sectionTitle}>Dashboard</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="cube-outline" size={22} color={Colors.black} />
                  <Text style={styles.statValue}>{products.length}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="receipt-outline" size={22} color={Colors.black} />
                  <Text style={styles.statValue}>{stats?.total ?? 0}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash-outline" size={22} color="#22C55E" />
                  <Text style={[styles.statValue, { color: '#22C55E' }]}>₦{((stats?.allRevenue ?? 0) / 1000).toFixed(0)}k</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="today-outline" size={22} color={Colors.black} />
                  <Text style={styles.statValue}>{stats?.todayCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
              </View>

              {/* Device stats */}
              {deviceStats && (
                <>
                  <Text style={styles.sectionTitle}>Visitors (Last 7 Days)</Text>
                  <View style={styles.deviceRow}>
                    {([
                      { key: 'mobile', icon: 'phone-portrait-outline', label: 'Mobile' },
                      { key: 'tablet', icon: 'tablet-portrait-outline', label: 'Tablet' },
                      { key: 'desktop', icon: 'desktop-outline', label: 'Desktop' },
                    ] as const).map(({ key, icon, label }) => (
                      <View key={key} style={styles.deviceCard}>
                        <Ionicons name={icon} size={18} color={Colors.muted} />
                        <Text style={styles.deviceValue}>{deviceStats[key]}</Text>
                        <Text style={styles.deviceLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={openAddProduct}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.black} />
                  <Text style={styles.actionText}>Add Product</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => setActiveTab('orders')}>
                  <Ionicons name="list-outline" size={20} color={Colors.black} />
                  <Text style={styles.actionText}>View Orders</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={load}>
                  <Ionicons name="refresh-outline" size={20} color={Colors.black} />
                  <Text style={styles.actionText}>Refresh</Text>
                </Pressable>
              </View>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {orders.slice(0, 4).map((order) => (
                <OrderRow
                  key={order.id} order={order} styles={styles}
                  onPress={() => handleUpdateOrderStatus(order)}
                  onDownload={() => handleDownloadInvoice(order)}
                />
              ))}
              <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Exit Admin Mode</Text>
              </Pressable>
            </>
          )}

          {/* ── Orders ── */}
          {activeTab === 'orders' && (
            <>
              <Text style={styles.sectionTitle}>All Orders ({orders.length})</Text>
              {orders.map((order) => (
                <OrderRow
                  key={order.id} order={order} styles={styles}
                  onPress={() => handleUpdateOrderStatus(order)}
                  onDownload={() => handleDownloadInvoice(order)}
                />
              ))}
            </>
          )}

          {/* ── Products ── */}
          {activeTab === 'products' && (
            <>
              <View style={styles.prodHeader}>
                <Text style={styles.sectionTitle}>
                  Products ({filteredProducts.length}{filteredProducts.length !== products.length ? `/${products.length}` : ''})
                </Text>
                <View style={styles.prodHeaderRight}>
                  <Pressable style={[styles.viewBtn, prodView === 'list' && styles.viewBtnActive]} onPress={() => setProdView('list')}>
                    <Ionicons name="list-outline" size={15} color={prodView === 'list' ? '#FFFFFF' : Colors.muted} />
                  </Pressable>
                  <Pressable style={[styles.viewBtn, prodView === 'grid' && styles.viewBtnActive]} onPress={() => setProdView('grid')}>
                    <Ionicons name="grid-outline" size={15} color={prodView === 'grid' ? '#FFFFFF' : Colors.muted} />
                  </Pressable>
                  <Pressable style={styles.addProductBtn} onPress={openAddProduct}>
                    <Ionicons name="add" size={15} color="#FFFFFF" />
                    <Text style={styles.addProductText}>Add</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={14} color={Colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or category..."
                  placeholderTextColor={Colors.muted}
                  value={prodSearch}
                  onChangeText={setProdSearch}
                />
                {prodSearch.length > 0 && (
                  <Pressable onPress={() => setProdSearch('')}>
                    <Ionicons name="close-circle" size={14} color={Colors.muted} />
                  </Pressable>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {([['', 'All'], ['women', 'Women'], ['men', 'Men']] as const).map(([val, label]) => (
                  <Pressable key={`g-${val}`} style={[styles.filterChip, prodGender === val && styles.filterChipActive]} onPress={() => setProdGender(val)}>
                    <Text style={[styles.filterChipText, prodGender === val && styles.filterChipTextActive]}>{label}</Text>
                  </Pressable>
                ))}
                <View style={styles.filterSep} />
                {([['', 'All'], ['in', 'In Stock'], ['out', 'Out of Stock']] as const).map(([val, label]) => (
                  <Pressable key={`s-${val}`} style={[styles.filterChip, prodStock === val && styles.filterChipActive]} onPress={() => setProdStock(val)}>
                    <Text style={[styles.filterChipText, prodStock === val && styles.filterChipTextActive]}>{label}</Text>
                  </Pressable>
                ))}
                <View style={styles.filterSep} />
                <Pressable style={[styles.filterChip, styles.sortChip]} onPress={() => setSortOpen(true)}>
                  <Ionicons name="funnel-outline" size={11} color={Colors.muted} />
                  <Text style={styles.filterChipText}>Sort</Text>
                </Pressable>
              </ScrollView>

              {filteredProducts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="cube-outline" size={32} color={Colors.border} />
                  <Text style={styles.emptyText}>No products found</Text>
                </View>
              ) : prodView === 'list' ? (
                <View style={styles.listContainer}>
                  {filteredProducts.map((p, idx) => (
                    <View key={p.id} style={[styles.listRow, idx < filteredProducts.length - 1 && styles.listRowBorder]}>
                      <View style={styles.thumb}>
                        {p.image ? (
                          <Image source={{ uri: fixUrl(p.image) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name="image-outline" size={20} color={Colors.border} />
                        )}
                        {!p.inStock && (
                          <View style={styles.thumbOverlay}>
                            <Text style={styles.thumbOverlayText}>OUT</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.listMeta}>{p.category.toUpperCase()} · {p.gender}</Text>
                        <Text style={styles.listPrice}>₦{p.price.toLocaleString()}</Text>
                      </View>
                      <Pressable style={[styles.stockChip, p.inStock ? styles.stockIn : styles.stockOut]} onPress={() => handleToggleStock(p)} disabled={togglingStockId === p.id}>
                        {togglingStockId === p.id
                          ? <ActivityIndicator size="small" color={p.inStock ? '#15803D' : '#B91C1C'} />
                          : <Text style={[styles.stockChipText, p.inStock ? styles.stockInText : styles.stockOutText]}>{p.inStock ? 'IN' : 'OUT'}</Text>
                        }
                      </Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => openEditProduct(p)}>
                        <Ionicons name="create-outline" size={17} color={Colors.muted} />
                      </Pressable>
                      <Pressable style={styles.iconBtn} onPress={() => handleDeleteProduct(p)}>
                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.gridWrap}>
                  {filteredProducts.map((p) => (
                    <View key={p.id} style={[styles.gridCard, { width: gridCardWidth }]}>
                      <View style={styles.gridImageWrap}>
                        {p.image ? (
                          <Image source={{ uri: fixUrl(p.image) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <View style={styles.gridNoImage}>
                            <Ionicons name="image-outline" size={28} color={Colors.border} />
                          </View>
                        )}
                        <View style={[styles.gridStockBadge, p.inStock ? styles.gridStockIn : styles.gridStockOut]}>
                          <Text style={[styles.gridStockBadgeText, p.inStock ? styles.gridStockInText : styles.gridStockOutText]}>
                            {p.inStock ? 'In Stock' : 'Sold Out'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.gridInfo}>
                        <Text style={styles.gridName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.gridMeta}>{p.category.toUpperCase()}</Text>
                        <Text style={styles.gridPrice}>₦{p.price.toLocaleString()}</Text>
                        <View style={styles.gridActions}>
                          <Pressable style={[styles.gridStockBtn, p.inStock ? styles.gridStockBtnIn : styles.gridStockBtnOut]} onPress={() => handleToggleStock(p)} disabled={togglingStockId === p.id}>
                            {togglingStockId === p.id
                              ? <ActivityIndicator size="small" color="#FFFFFF" />
                              : <Text style={styles.gridStockBtnText}>{p.inStock ? 'In Stock' : 'Out'}</Text>
                            }
                          </Pressable>
                          <Pressable style={styles.gridIconBtn} onPress={() => openEditProduct(p)}>
                            <Ionicons name="create-outline" size={14} color={Colors.muted} />
                          </Pressable>
                          <Pressable style={styles.gridIconBtn} onPress={() => handleDeleteProduct(p)}>
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Modal visible={sortOpen} transparent animationType="slide">
                <Pressable style={styles.modalBg} onPress={() => setSortOpen(false)}>
                  <View style={styles.sortSheet}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.sortTitle}>SORT BY</Text>
                    {SORT_OPTIONS.map((opt) => (
                      <Pressable key={opt.key} style={styles.sortOption} onPress={() => { setProdSort(opt.key as typeof prodSort); setSortOpen(false); }}>
                        <Text style={[styles.sortOptionText, prodSort === opt.key && styles.sortOptionActive]}>{opt.label}</Text>
                        {prodSort === opt.key && <Ionicons name="checkmark" size={15} color={Colors.black} />}
                      </Pressable>
                    ))}
                  </View>
                </Pressable>
              </Modal>
            </>
          )}

          {/* ── Support / Chat ── */}
          {activeTab === 'support' && (
            <>
              <View style={styles.prodHeader}>
                <Text style={styles.sectionTitle}>Customer Chats ({chats.length})</Text>
                <Pressable style={styles.refreshBtn} onPress={loadChats}>
                  <Ionicons name="refresh-outline" size={16} color={Colors.muted} />
                </Pressable>
              </View>

              {chatsLoading ? (
                <View style={styles.loadingBox}><ActivityIndicator size="large" color={Colors.black} /></View>
              ) : chats.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="chatbubbles-outline" size={36} color={Colors.border} />
                  <Text style={styles.emptyText}>No customer chats yet</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {chats.map((chat, idx) => {
                    const last = chat.messages[chat.messages.length - 1];
                    return (
                      <Pressable
                        key={chat.id}
                        style={[styles.chatRow, idx < chats.length - 1 && styles.listRowBorder]}
                        onPress={() => openChatThread(chat)}
                      >
                        <View style={styles.chatAvatar}>
                          <Text style={styles.chatAvatarText}>{chat.customerName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.chatRowInfo}>
                          <View style={styles.chatRowTop}>
                            <Text style={styles.chatRowName}>{chat.customerName}</Text>
                            <Text style={styles.chatRowTime}>
                              {new Date(chat.updatedAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                          <Text style={styles.chatRowPreview} numberOfLines={1}>
                            {last ? `${last.from === 'admin' ? 'You: ' : ''}${last.text}` : chat.customerEmail}
                          </Text>
                          <View style={styles.chatRowBottom}>
                            <View style={[styles.chatStatusPill, chat.status === 'open' ? styles.chatPillOpen : styles.chatPillClosed]}>
                              <Text style={[styles.chatStatusPillText, chat.status === 'open' ? styles.chatPillOpenText : styles.chatPillClosedText]}>
                                {chat.status}
                              </Text>
                            </View>
                            {(chat.unreadAdmin ?? 0) > 0 && (
                              <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{chat.unreadAdmin}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Product Modal */}
      <Modal visible={productModal} transparent animationType="slide">
        <View style={styles.prodModalBg}>
          <View style={styles.prodModalSheet}>
            <View style={styles.prodModalHeader}>
              <Text style={styles.prodModalTitle}>{editingProduct.id ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</Text>
              <Pressable onPress={() => setProductModal(false)}>
                <Ionicons name="close" size={22} color={Colors.black} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Name" value={editingProduct.name ?? ''} onChangeText={(v) => setEditingProduct((p) => ({ ...p, name: v }))} styles={styles} Colors={Colors} />
              <Field label="Price (₦)" value={String(editingProduct.price ?? '')} onChangeText={(v) => setEditingProduct((p) => ({ ...p, price: Number(v) || 0 }))} keyboardType="numeric" styles={styles} Colors={Colors} />
              <Field label="Original Price (₦, if on sale)" value={String(editingProduct.originalPrice ?? '')} onChangeText={(v) => setEditingProduct((p) => ({ ...p, originalPrice: v ? Number(v) : undefined }))} keyboardType="numeric" styles={styles} Colors={Colors} />
              <Field label="Image URL" value={editingProduct.image ?? ''} onChangeText={(v) => setEditingProduct((p) => ({ ...p, image: v }))} styles={styles} Colors={Colors} />
              <Field label="Gender (women / men / unisex)" value={editingProduct.gender ?? ''} onChangeText={(v) => setEditingProduct((p) => ({ ...p, gender: v }))} styles={styles} Colors={Colors} />
              <Field label="Category" value={editingProduct.category ?? ''} onChangeText={(v) => setEditingProduct((p) => ({ ...p, category: v }))} styles={styles} Colors={Colors} />
              <Field label="Sizes (comma-separated)" value={(editingProduct.sizes ?? []).join(', ')} onChangeText={(v) => setEditingProduct((p) => ({ ...p, sizes: v.split(',').map((s) => s.trim()).filter(Boolean) }))} styles={styles} Colors={Colors} />
              <Field label="Colors (comma-separated)" value={(editingProduct.colors ?? []).join(', ')} onChangeText={(v) => setEditingProduct((p) => ({ ...p, colors: v.split(',').map((s) => s.trim()).filter(Boolean) }))} styles={styles} Colors={Colors} />
              <Field label="Description" value={editingProduct.description ?? ''} onChangeText={(v) => setEditingProduct((p) => ({ ...p, description: v }))} multiline styles={styles} Colors={Colors} />
              <View style={styles.toggleRow}>
                {(['isNew', 'isSale', 'isFeatured', 'inStock'] as const).map((flag) => (
                  <Pressable key={flag} style={[styles.toggleChip, editingProduct[flag] && styles.toggleChipActive]} onPress={() => setEditingProduct((p) => ({ ...p, [flag]: !p[flag] }))}>
                    <Text style={[styles.toggleText, editingProduct[flag] && styles.toggleTextActive]}>{flag}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveProduct} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.saveBtnText}>{editingProduct.id ? 'SAVE CHANGES' : 'ADD PRODUCT'}</Text>
                }
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function OrderRow({ order, styles, onPress, onDownload }: {
  order: ApiOrder;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
  onDownload: () => void;
}) {
  const color = STATUS_COLORS[order.status] ?? '#6B7280';
  return (
    <Pressable style={styles.orderRow} onPress={onPress}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>{order.id}</Text>
        <Text style={styles.orderCustomer}>{order.customer?.name ?? '—'}</Text>
        <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-NG')}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderAmount}>₦{(order.total ?? 0).toLocaleString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.statusText, { color }]}>{order.status.replace(/_/g, ' ')}</Text>
        </View>
        <Pressable style={styles.invoiceBtn} onPress={onDownload} hitSlop={8}>
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, keyboardType, multiline, styles, Colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric'; multiline?: boolean;
  styles: ReturnType<typeof makeStyles>; Colors: ReturnType<typeof import('@/lib/theme').useColors>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'} multiline={multiline}
        placeholderTextColor={Colors.muted}
      />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import('@/lib/theme').useColors>, _width: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    tabBar: { flexDirection: 'row', backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderColor: C.black },
    tabInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tabText: { fontSize: 10, fontWeight: '600', color: C.muted, letterSpacing: 0.8 },
    tabTextActive: { color: C.black },
    tabBadge: { backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    tabBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    content: { padding: Spacing.md, paddingBottom: 40 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: C.black, letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.sm },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: 4 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: Spacing.md, alignItems: 'center', gap: 6 },
    statValue: { fontSize: 22, fontWeight: '700', color: C.black },
    statLabel: { fontSize: 11, color: C.muted, letterSpacing: 0.5 },

    // Device stats
    deviceRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
    deviceCard: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: Spacing.sm, alignItems: 'center', gap: 4 },
    deviceValue: { fontSize: 18, fontWeight: '700', color: C.black },
    deviceLabel: { fontSize: 10, color: C.muted, letterSpacing: 0.3 },

    actions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
    actionBtn: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: 'center', gap: 6 },
    actionText: { fontSize: 11, color: C.black, fontWeight: '500' },

    orderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: Spacing.md, marginBottom: Spacing.sm },
    orderInfo: { flex: 1, gap: 2 },
    orderId: { fontSize: 13, fontWeight: '600', color: C.black },
    orderCustomer: { fontSize: 12, color: C.muted },
    orderDate: { fontSize: 11, color: C.border },
    orderRight: { alignItems: 'flex-end', gap: 5 },
    orderAmount: { fontSize: 14, fontWeight: '600', color: C.black },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    invoiceBtn: { padding: 2 },

    signOutBtn: { marginTop: Spacing.xl, borderWidth: 1, borderColor: '#EF4444', paddingVertical: 14, alignItems: 'center' },
    signOutText: { color: '#EF4444', fontSize: 13, fontWeight: '600', letterSpacing: 1 },

    // Products tab
    prodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.sm },
    prodHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    refreshBtn: { padding: 6 },
    viewBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
    viewBtnActive: { backgroundColor: C.black, borderColor: C.black },
    addProductBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1C1C1C', paddingHorizontal: 10, paddingVertical: 6 },
    addProductText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 10 },
    searchInput: { flex: 1, fontSize: 13, color: C.black, padding: 0 },
    filterRow: { gap: 6, paddingBottom: 10, alignItems: 'center' },
    filterChip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.white },
    filterChipActive: { backgroundColor: C.black, borderColor: C.black },
    filterChipText: { fontSize: 11, color: C.muted },
    filterChipTextActive: { color: C.cream, fontWeight: '600' },
    filterSep: { width: 1, height: 18, backgroundColor: C.border, marginHorizontal: 4 },
    sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { fontSize: 13, color: C.muted },

    // List view
    listContainer: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
    listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 10, gap: 8 },
    listRowBorder: { borderBottomWidth: 1, borderColor: C.border },
    thumb: { width: 48, height: 62, backgroundColor: C.cream, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
    thumbOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(239,68,68,0.85)', paddingVertical: 2, alignItems: 'center' },
    thumbOverlayText: { fontSize: 7, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    listInfo: { flex: 1, gap: 2 },
    listName: { fontSize: 12, fontWeight: '500', color: C.black },
    listMeta: { fontSize: 10, color: C.muted, letterSpacing: 0.3 },
    listPrice: { fontSize: 12, fontWeight: '600', color: C.black },
    stockChip: { paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, minWidth: 36, alignItems: 'center' },
    stockIn: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    stockOut: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
    stockChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    stockInText: { color: '#15803D' },
    stockOutText: { color: '#B91C1C' },
    iconBtn: { padding: 5 },

    // Grid view
    gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    gridImageWrap: { aspectRatio: 3 / 4, backgroundColor: C.cream, position: 'relative' },
    gridNoImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    gridStockBadge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2 },
    gridStockIn: { backgroundColor: '#DCFCE7' },
    gridStockOut: { backgroundColor: '#FEE2E2' },
    gridStockBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
    gridStockInText: { color: '#15803D' },
    gridStockOutText: { color: '#B91C1C' },
    gridInfo: { padding: 8, gap: 3 },
    gridName: { fontSize: 12, fontWeight: '500', color: C.black },
    gridMeta: { fontSize: 9, color: C.muted, letterSpacing: 0.5 },
    gridPrice: { fontSize: 13, fontWeight: '700', color: C.black },
    gridActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, borderTopWidth: 1, borderColor: C.border, paddingTop: 6 },
    gridStockBtn: { flex: 1, paddingVertical: 5, alignItems: 'center' },
    gridStockBtnIn: { backgroundColor: '#F0FDF4' },
    gridStockBtnOut: { backgroundColor: '#FEF2F2' },
    gridStockBtnText: { fontSize: 9, fontWeight: '700', color: C.black },
    gridIconBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

    // Sort modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    sortSheet: { backgroundColor: C.white, paddingBottom: 36, paddingTop: 12 },
    sortTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: C.muted, paddingHorizontal: Spacing.md, marginBottom: 8 },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.border },
    sortOptionText: { fontSize: 14, color: C.muted },
    sortOptionActive: { color: C.black, fontWeight: '600' },

    // Add/Edit product modal
    prodModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    prodModalSheet: { backgroundColor: C.white, maxHeight: '90%', paddingHorizontal: Spacing.md, paddingBottom: 40 },
    prodModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border, marginBottom: 12 },
    prodModalTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.black },
    fieldGroup: { marginBottom: 12 },
    fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: C.muted, marginBottom: 4 },
    fieldInput: { borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: C.black },
    toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    toggleChip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6 },
    toggleChipActive: { backgroundColor: C.black, borderColor: C.black },
    toggleText: { fontSize: 11, color: C.muted },
    toggleTextActive: { color: C.cream, fontWeight: '600' },
    saveBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveBtnText: { color: C.cream, fontSize: 13, fontWeight: '600', letterSpacing: 2 },

    // Chat list
    chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 12, gap: 10 },
    chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
    chatAvatarText: { fontSize: 16, fontWeight: '700', color: C.cream },
    chatRowInfo: { flex: 1, gap: 3 },
    chatRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatRowName: { fontSize: 13, fontWeight: '600', color: C.black },
    chatRowTime: { fontSize: 10, color: C.muted },
    chatRowPreview: { fontSize: 12, color: C.muted },
    chatRowBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    chatStatusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 2, borderWidth: 1 },
    chatPillOpen: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    chatPillClosed: { backgroundColor: '#F5F5F5', borderColor: C.border },
    chatStatusPillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    chatPillOpenText: { color: '#15803D' },
    chatPillClosedText: { color: C.muted },
    unreadBadge: { backgroundColor: '#EF4444', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    unreadBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

    // Chat thread
    chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border },
    chatBack: { padding: 4 },
    chatHeaderInfo: { flex: 1, gap: 1 },
    chatHeaderName: { fontSize: 14, fontWeight: '600', color: C.black },
    chatHeaderEmail: { fontSize: 11, color: C.muted },
    chatStatusBtn: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
    chatStatusOpen: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
    chatStatusClosed: { backgroundColor: '#F5F5F5', borderColor: C.border },
    chatStatusBtnText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: C.black },
    chatMessages: { flex: 1, backgroundColor: C.cream },
    chatMessagesContent: { padding: Spacing.md, gap: 8 },
    bubble: { maxWidth: '80%', padding: 10, borderRadius: 4 },
    bubbleAdmin: { alignSelf: 'flex-end', backgroundColor: C.black },
    bubbleCustomer: { alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    bubbleText: { fontSize: 13, lineHeight: 19 },
    bubbleTextAdmin: { color: C.cream },
    bubbleTextCustomer: { color: C.black },
    bubbleTime: { fontSize: 9, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
    replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: Spacing.sm, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
    replyInput: { flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: C.black, maxHeight: 80, borderRadius: 2 },
    sendBtn: { width: 40, height: 40, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  });
}
