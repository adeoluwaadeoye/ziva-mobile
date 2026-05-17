import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useColors, Spacing } from '@/lib/theme';
import { useProducts } from '@/lib/ProductsContext';
import ProductCard from '@/components/ProductCard';
import AppHeader from '@/components/AppHeader';

const FILTERS = [
  { key: 'all', label: 'All' }, { key: 'women', label: 'Women' }, { key: 'men', label: 'Men' },
  { key: 'new', label: 'New In' }, { key: 'sale', label: 'Sale' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Styles' }, { key: 'ankara', label: 'Ankara' }, { key: 'aso-oke', label: 'Aso-Oke' },
  { key: 'kaftan', label: 'Kaftan' }, { key: 'adire', label: 'Adire' }, { key: 'cord', label: 'Cord' },
  { key: 'agbada', label: 'Agbada' }, { key: 'senator', label: 'Senator' }, { key: 'dashiki', label: 'Dashiki' },
  { key: 'native-shirt', label: 'Native' }, { key: 'linen', label: 'Linen' }, { key: 'gown', label: 'Gown' },
];

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured' }, { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: Low → High' }, { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'rating', label: 'Top Rated' },
];

const GAP = 8;
const H_PAD = 8;

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - H_PAD * 2 - GAP) / 2;
  const { filter: routeFilter } = useLocalSearchParams<{ filter?: string }>();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(routeFilter || 'all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortKey, setSortKey] = useState('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const { products } = useProducts();

  useEffect(() => { if (routeFilter) setActiveFilter(routeFilter); }, [routeFilter]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeFilter === 'women') list = list.filter((p) => p.gender === 'women');
    else if (activeFilter === 'men') list = list.filter((p) => p.gender === 'men');
    else if (activeFilter === 'new') list = list.filter((p) => p.isNew);
    else if (activeFilter === 'sale') list = list.filter((p) => p.isSale);
    if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    list = [...list];
    if (sortKey === 'newest') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    else if (sortKey === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortKey === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortKey === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return list;
  }, [activeFilter, activeCategory, search, sortKey, products]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.muted} />
        <TextInput style={styles.searchInput} placeholder="Search products..." placeholderTextColor={Colors.muted} value={search} onChangeText={setSearch} returnKeyType="search" />
        {search.length > 0 && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={Colors.muted} /></Pressable>}
      </View>
      <View style={styles.controlRow}>
        <FlatList
          data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.key}
          style={{ flex: 1 }} contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Pressable style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]} onPress={() => setActiveFilter(item.key)}>
              <Text style={[styles.filterLabel, activeFilter === item.key && styles.filterLabelActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
        <Pressable style={styles.sortBtn} onPress={() => setSortOpen(true)}>
          <Ionicons name="funnel-outline" size={14} color={Colors.black} />
          <Text style={styles.sortBtnText}>Sort</Text>
        </Pressable>
      </View>
      <View style={styles.categoryRow}>
        <FlatList
          data={CATEGORY_FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoryFilterRow}
          renderItem={({ item }) => (
            <Pressable style={[styles.categoryChip, activeCategory === item.key && styles.categoryChipActive]} onPress={() => setActiveCategory(item.key)}>
              <Text style={[styles.categoryChipLabel, activeCategory === item.key && styles.categoryChipLabelActive]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={40} color={Colors.border} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={(item) => item.id} numColumns={2}
          showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        />
      )}
      <Modal visible={sortOpen} transparent animationType="slide">
        <Pressable style={styles.modalBg} onPress={() => setSortOpen(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>SORT BY</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable key={opt.key} style={styles.sortOption} onPress={() => { setSortKey(opt.key); setSortOpen(false); }}>
                <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionActive]}>{opt.label}</Text>
                {sortKey === opt.key && <Ionicons name="checkmark" size={16} color={Colors.black} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.md, marginBottom: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 14, color: C.black, padding: 0 },
    controlRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: C.border },
    filterRow: { paddingHorizontal: Spacing.md, gap: 8, paddingBottom: 12 },
    filterChip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.white },
    filterChipActive: { backgroundColor: C.black, borderColor: C.black },
    filterLabel: { fontSize: 12, color: C.muted, letterSpacing: 0.5 },
    filterLabelActive: { color: C.cream, fontWeight: '600' },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, borderLeftWidth: 1, borderColor: C.border, marginBottom: 12 },
    sortBtnText: { fontSize: 12, color: C.black, fontWeight: '500' },
    categoryRow: { borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.white },
    categoryFilterRow: { paddingHorizontal: Spacing.md, gap: 6, paddingVertical: 10 },
    categoryChip: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: C.cream, borderRadius: 2 },
    categoryChipActive: { backgroundColor: C.black, borderColor: C.black },
    categoryChipLabel: { fontSize: 11, color: C.muted, letterSpacing: 0.5 },
    categoryChipLabelActive: { color: C.cream, fontWeight: '600' },
    grid: { paddingHorizontal: H_PAD, paddingTop: GAP, paddingBottom: 32 },
    gridRow: { gap: GAP },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 80 },
    emptyText: { fontSize: 14, color: C.muted },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.white, paddingBottom: 40, paddingTop: 12 },
    modalHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: C.muted, paddingHorizontal: Spacing.md, marginBottom: 8 },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 15, borderBottomWidth: 1, borderColor: C.border },
    sortOptionText: { fontSize: 14, color: C.muted },
    sortOptionActive: { color: C.black, fontWeight: '600' },
  });
}
