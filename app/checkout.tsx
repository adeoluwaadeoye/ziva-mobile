import { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors, Spacing } from '@/lib/theme';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useOrders } from '@/lib/OrderContext';
import { useUserData } from '@/lib/UserDataContext';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';

const DELIVERY_FEE = 3500;
const PAYMENT_CALLBACK_URL = `${API_BASE_URL}/payment-callback`;

const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

type DeliveryMode = 'saved' | 'manual';

interface PendingPayment {
  url: string;
  ref: string;
  customer: { name: string; email: string; phone?: string };
  delivery: { address: string; city: string; state: string };
}

function parseQueryParam(url: string, key: string): string | null {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { addresses } = useUserData();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const defaultId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultId);
  const [mode, setMode] = useState<DeliveryMode>(addresses.length > 0 ? 'saved' : 'manual');

  const [manualName, setManualName] = useState(user?.name ?? '');
  const [manualPhone, setManualPhone] = useState('');
  const [manualStreet, setManualStreet] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [statePickerVisible, setStatePickerVisible] = useState(false);

  const [initializing, setInitializing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const paymentHandled = useRef(false);

  const grandTotal = totalPrice + DELIVERY_FEE;

  const resetForm = () => {
    setManualName(user?.name ?? '');
    setManualPhone('');
    setManualStreet('');
    setManualCity('');
    setManualState('');
    setSelectedAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
    setMode(addresses.length > 0 ? 'saved' : 'manual');
  };

  const handlePaymentCallback = useCallback(async (url: string) => {
    if (paymentHandled.current || !pendingPayment) return;
    paymentHandled.current = true;

    const { ref, customer, delivery } = pendingPayment;
    const paidRef = parseQueryParam(url, 'reference') ?? parseQueryParam(url, 'trxref') ?? ref;

    setPendingPayment(null);
    setPlacing(true);
    try {
      await placeOrder(items, customer, delivery, DELIVERY_FEE, paidRef);
      clearCart();
      resetForm();
      router.replace('/orders');
      setTimeout(() => {
        Alert.alert('Order Placed!', "Payment confirmed. We'll start processing your order right away.");
      }, 300);
    } catch (err: any) {
      Alert.alert('Payment Failed', err.message ?? 'Could not complete payment. Please contact support.');
    } finally {
      setPlacing(false);
    }
  }, [pendingPayment, items, placeOrder, clearCart, router]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={44} color={Colors.border} />
          <Text style={styles.guestTitle}>Sign in to checkout</Text>
          <Text style={styles.guestSub}>You need an account to place an order.</Text>
          <Pressable style={styles.signInBtn} onPress={() => router.push('/auth/sign-in?redirect=/checkout')}>
            <Text style={styles.signInBtnText}>SIGN IN</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handlePlaceOrder = async () => {
    let customer: { name: string; email: string; phone?: string };
    let delivery: { address: string; city: string; state: string };

    if (mode === 'saved') {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (!addr) { Alert.alert('Address required', 'Please select a delivery address.'); return; }
      customer = { name: addr.fullName, email: user.email, phone: addr.phone };
      delivery = { address: addr.street, city: addr.city, state: addr.state };
    } else {
      if (!manualName.trim() || !manualPhone.trim() || !manualStreet.trim() || !manualCity.trim() || !manualState) {
        Alert.alert('Missing info', 'Please fill in all required delivery fields.');
        return;
      }
      customer = { name: manualName.trim(), email: user.email, phone: manualPhone.trim() };
      delivery = { address: manualStreet.trim(), city: manualCity.trim(), state: manualState };
    }

    setInitializing(true);
    try {
      const ref = `MOB-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const { authorization_url } = await api.payment.initialize({
        email: user.email,
        amount: grandTotal,
        reference: ref,
        callbackUrl: PAYMENT_CALLBACK_URL,
      });
      paymentHandled.current = false;
      setPendingPayment({ url: authorization_url, ref, customer, delivery });
    } catch (err: any) {
      Alert.alert('Payment Error', err.message ?? 'Could not initiate payment. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleClosePayment = () => {
    setPendingPayment(null);
    paymentHandled.current = false;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Delivery Address ── */}
          <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>

          {addresses.length > 0 && (
            <>
              {addresses.map((addr) => {
                const isSelected = mode === 'saved' && selectedAddressId === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    style={[styles.addrCard, isSelected && styles.addrCardActive]}
                    onPress={() => { setSelectedAddressId(addr.id); setMode('saved'); }}
                  >
                    <View style={styles.radioRow}>
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: Colors.black }]} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.addrTitleRow}>
                          <Text style={[styles.addrNickname, { color: Colors.black }]}>
                            {addr.nickname || 'Address'}
                          </Text>
                          {addr.isDefault && (
                            <View style={[styles.defaultBadge, { backgroundColor: Colors.black }]}>
                              <Text style={[styles.defaultBadgeText, { color: Colors.cream }]}>DEFAULT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.addrLine, { color: Colors.muted }]}>
                          {addr.fullName} · {addr.phone}
                        </Text>
                        <Text style={[styles.addrLine, { color: Colors.muted }]}>
                          {addr.street}, {addr.city}, {addr.state}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                style={[styles.addrCard, mode === 'manual' && styles.addrCardActive]}
                onPress={() => setMode('manual')}
              >
                <View style={styles.radioRow}>
                  <View style={[styles.radio, mode === 'manual' && styles.radioActive]}>
                    {mode === 'manual' && <View style={[styles.radioDot, { backgroundColor: Colors.black }]} />}
                  </View>
                  <Text style={[styles.manualToggle, { color: Colors.black }]}>Use a different address</Text>
                </View>
              </Pressable>
            </>
          )}

          {(mode === 'manual' || addresses.length === 0) && (
            <View style={[styles.manualForm, { borderColor: Colors.border, backgroundColor: Colors.white }]}>
              {[
                { label: 'Full Name *', value: manualName, set: setManualName, phone: false },
                { label: 'Phone *', value: manualPhone, set: setManualPhone, phone: true },
                { label: 'Street Address *', value: manualStreet, set: setManualStreet, phone: false },
                { label: 'City *', value: manualCity, set: setManualCity, phone: false },
              ].map(({ label, value, set, phone }) => (
                <View key={label} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: Colors.muted }]}>{label}</Text>
                  <TextInput
                    style={[styles.formInput, { borderColor: Colors.border, color: Colors.black, backgroundColor: Colors.cream }]}
                    value={value}
                    onChangeText={set}
                    placeholder={label.replace(' *', '')}
                    placeholderTextColor={Colors.muted}
                    keyboardType={phone ? 'phone-pad' : 'default'}
                    autoCapitalize={phone ? 'none' : 'words'}
                  />
                </View>
              ))}

              {/* State picker */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: Colors.muted }]}>State *</Text>
                <Pressable
                  style={[styles.formInput, styles.pickerBtn, { borderColor: Colors.border, backgroundColor: Colors.cream }]}
                  onPress={() => setStatePickerVisible(true)}
                >
                  <Text style={[styles.pickerBtnText, { color: manualState ? Colors.black : Colors.muted }]}>
                    {manualState || 'Select state...'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.muted} />
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Order Summary ── */}
          <Text style={[styles.sectionTitle, styles.sectionGap]}>ORDER SUMMARY</Text>
          <View style={[styles.summaryCard, { borderColor: Colors.border, backgroundColor: Colors.white }]}>
            {items.map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={[styles.summaryItemName, { color: Colors.black }]} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={[styles.summaryMeta, { color: Colors.muted }]}>
                  ×{item.quantity} · {item.selectedSize}
                </Text>
                <Text style={[styles.summaryItemPrice, { color: Colors.black }]}>
                  ₦{(item.product.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: Colors.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalRowLabel, { color: Colors.muted }]}>Subtotal</Text>
              <Text style={[styles.totalRowValue, { color: Colors.black }]}>₦{totalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalRowLabel, { color: Colors.muted }]}>Delivery</Text>
              <Text style={[styles.totalRowValue, { color: Colors.black }]}>₦{DELIVERY_FEE.toLocaleString()}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow, { borderColor: Colors.border }]}>
              <Text style={[styles.grandLabel, { color: Colors.black }]}>Total</Text>
              <Text style={[styles.grandValue, { color: Colors.black }]}>₦{grandTotal.toLocaleString()}</Text>
            </View>
          </View>

          {/* ── Pay Now ── */}
          <Pressable
            style={[styles.placeBtn, { backgroundColor: Colors.black }, (initializing || placing) && { opacity: 0.6 }]}
            onPress={handlePlaceOrder}
            disabled={initializing || placing}
          >
            {initializing || placing ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.cream} />
                <Text style={[styles.placeBtnText, { color: Colors.cream }]}>
                  PAY SECURELY · ₦{grandTotal.toLocaleString()}
                </Text>
              </>
            )}
          </Pressable>
          <Text style={[styles.secureNote, { color: Colors.muted }]}>
            Card · Bank Transfer · USSD — powered by Paystack
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── State picker modal ── */}
      <Modal
        visible={statePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setStatePickerVisible(false)} />
          <View style={[styles.stateModal, { backgroundColor: Colors.white, borderTopColor: Colors.border }]}>
            <View style={[styles.stateModalHeader, { borderColor: Colors.border }]}>
              <Text style={[styles.stateModalTitle, { color: Colors.black }]}>Select State</Text>
              <Pressable onPress={() => setStatePickerVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.muted} />
              </Pressable>
            </View>
            <FlatList
              data={NIGERIA_STATES}
              keyExtractor={(s) => s}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.stateOption, item === manualState && { backgroundColor: Colors.cream }]}
                  onPress={() => { setManualState(item); setStatePickerVisible(false); }}
                >
                  <Text style={[styles.stateOptionText, { color: Colors.black }, item === manualState && styles.stateOptionSelected]}>
                    {item}
                  </Text>
                  {item === manualState && <Ionicons name="checkmark" size={14} color={Colors.black} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Paystack inline payment modal ── */}
      {pendingPayment && (
        <Modal visible animationType="slide" onRequestClose={handleClosePayment}>
          <SafeAreaView style={[styles.paymentModal, { backgroundColor: Colors.white }]} edges={['top', 'bottom']}>
            <View style={[styles.paymentHeader, { borderColor: Colors.border }]}>
              <Pressable style={styles.paymentClose} onPress={handleClosePayment}>
                <Ionicons name="close" size={22} color={Colors.black} />
              </Pressable>
              <Text style={[styles.paymentTitle, { color: Colors.black }]}>SECURE PAYMENT</Text>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.muted} />
            </View>
            <WebView
              source={{ uri: pendingPayment.url }}
              onNavigationStateChange={(state) => {
                if (state.url.startsWith(PAYMENT_CALLBACK_URL)) {
                  handlePaymentCallback(state.url);
                }
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={[StyleSheet.absoluteFill, styles.webLoading, { backgroundColor: Colors.cream }]}>
                  <ActivityIndicator size="large" color={Colors.black} />
                  <Text style={[styles.webLoadingText, { color: Colors.muted }]}>Loading payment…</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* ── Placing order overlay (after payment) ── */}
      {placing && (
        <View style={styles.placingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.placingText}>Confirming order…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, paddingBottom: 48, gap: 8 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: Spacing.xl },
    guestTitle: { fontSize: 18, fontWeight: '500', color: C.black },
    guestSub: { fontSize: 13, color: C.muted, textAlign: 'center' },
    signInBtn: { backgroundColor: C.black, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
    signInBtnText: { color: C.cream, fontSize: 12, letterSpacing: 2, fontWeight: '700' },

    sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: C.muted, marginBottom: 4 },
    sectionGap: { marginTop: Spacing.md },

    addrCard: {
      backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
      padding: Spacing.md,
    },
    addrCardActive: { borderColor: C.black },
    radioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    radio: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center', marginTop: 1,
    },
    radioActive: { borderColor: C.black },
    radioDot: { width: 8, height: 8, borderRadius: 4 },
    addrTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    addrNickname: { fontSize: 13, fontWeight: '700' },
    defaultBadge: { paddingHorizontal: 5, paddingVertical: 2 },
    defaultBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
    addrLine: { fontSize: 12, lineHeight: 18 },
    manualToggle: { fontSize: 13, fontWeight: '500', flex: 1 },

    manualForm: { borderWidth: 1, padding: Spacing.md, gap: 12 },
    formField: { gap: 5 },
    formLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    formInput: {
      borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11,
      fontSize: 14,
    },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pickerBtnText: { fontSize: 14, flex: 1 },

    summaryCard: { borderWidth: 1, padding: Spacing.md, gap: 10 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryItemName: { flex: 1, fontSize: 13 },
    summaryMeta: { fontSize: 11 },
    summaryItemPrice: { fontSize: 13, fontWeight: '600' },
    divider: { height: 1, marginVertical: 2 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalRowLabel: { fontSize: 13 },
    totalRowValue: { fontSize: 13 },
    grandTotalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
    grandLabel: { fontSize: 15, fontWeight: '600' },
    grandValue: { fontSize: 16, fontWeight: '700' },

    placeBtn: {
      paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 10, marginTop: Spacing.sm,
    },
    placeBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
    secureNote: { textAlign: 'center', fontSize: 11, marginTop: 6 },

    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    stateModal: { borderTopWidth: 1, maxHeight: '70%' },
    stateModalHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1,
    },
    stateModalTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
    stateOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: 14,
    },
    stateOptionText: { fontSize: 14 },
    stateOptionSelected: { fontWeight: '700' },

    paymentModal: { flex: 1 },
    paymentHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: 14,
      borderBottomWidth: 1,
    },
    paymentClose: { padding: 4 },
    paymentTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
    webLoading: {
      alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    webLoadingText: { fontSize: 13 },

    placingOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    },
    placingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  });
}
