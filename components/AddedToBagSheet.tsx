import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing } from '@/lib/theme';

interface Props {
  visible: boolean;
  productName: string;
  productImage: any;
  selectedSize: string;
  selectedColor: string;
  price: number;
  onDismiss: () => void;
  onViewBag: () => void;
}

export function AddedToBagSheet({
  visible, productName, productImage, selectedSize, selectedColor, price, onDismiss, onViewBag,
}: Props) {
  const Colors = useColors();
  const ty = useRef(new Animated.Value(200)).current;
  const op = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (visible) {
      Animated.parallel([
        Animated.spring(ty, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(onDismiss, 4500);
    } else {
      Animated.parallel([
        Animated.timing(ty, { toValue: 200, duration: 240, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.sheet,
        {
          backgroundColor: Colors.white,
          borderColor: Colors.border,
          transform: [{ translateY: ty }],
          opacity: op,
        },
      ]}
    >
      <View style={styles.row}>
        <Image source={productImage} style={[styles.img, { borderColor: Colors.border }]} contentFit="cover" />
        <View style={styles.info}>
          <View style={styles.checkRow}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={13} color="#fff" />
            </View>
            <Text style={[styles.addedLabel, { color: Colors.muted }]}>Added to bag</Text>
          </View>
          <Text style={[styles.name, { color: Colors.black }]} numberOfLines={2}>{productName}</Text>
          <Text style={[styles.variant, { color: Colors.muted }]}>{selectedSize} · {selectedColor}</Text>
          <Text style={[styles.price, { color: Colors.black }]}>₦{price.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, { borderWidth: 1, borderColor: Colors.border }]}
          onPress={onDismiss}
        >
          <Text style={[styles.btnText, { color: Colors.black }]}>Continue Shopping</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, { backgroundColor: Colors.black }]}
          onPress={onViewBag}
        >
          <Ionicons name="bag-outline" size={15} color={Colors.cream} />
          <Text style={[styles.btnText, { color: Colors.cream }]}>View Bag</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 90,
    left: 12,
    right: 12,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 14,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  img: { width: 64, height: 80, borderWidth: 1 },
  info: { flex: 1, gap: 3 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },
  addedLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  name: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  variant: { fontSize: 11 },
  price: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  btnText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
});
