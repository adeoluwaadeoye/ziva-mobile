import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing } from '@/lib/theme';
import { useUserData, Address } from '@/lib/UserDataContext';

type FormData = Omit<Address, 'id'>;

const emptyForm: FormData = {
  nickname: '', fullName: '', phone: '', street: '', city: '', state: '', landmark: '', isDefault: false,
};

const STRING_FIELDS: { key: Exclude<keyof FormData, 'isDefault'>; label: string; phone?: boolean }[] = [
  { key: 'nickname', label: 'Nickname (e.g. Home, Office)' },
  { key: 'fullName', label: 'Full Name *' },
  { key: 'phone',    label: 'Phone Number *', phone: true },
  { key: 'street',   label: 'Street Address *' },
  { key: 'city',     label: 'City *' },
  { key: 'state',    label: 'State *' },
  { key: 'landmark', label: 'Landmark (optional)' },
];

export default function AddressesScreen() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setModalVisible(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      nickname: addr.nickname, fullName: addr.fullName, phone: addr.phone,
      street: addr.street, city: addr.city, state: addr.state,
      landmark: addr.landmark, isDefault: addr.isDefault,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim()) {
      Alert.alert('Missing fields', 'Please fill in name, phone, street, city, and state.');
      return;
    }
    if (editingId) {
      updateAddress(editingId, form);
    } else {
      addAddress(form);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete address', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptyText}>Add a delivery address for faster checkout.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={styles.addrCard}>
              <View style={styles.addrHeader}>
                <View style={styles.addrTitleRow}>
                  <Text style={styles.addrNickname}>{addr.nickname || 'Address'}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addrActions}>
                  {!addr.isDefault && (
                    <Pressable onPress={() => setDefaultAddress(addr.id)} hitSlop={8}>
                      <Text style={styles.setDefaultText}>Set default</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => openEdit(addr)} hitSlop={8}>
                    <Ionicons name="create-outline" size={18} color={Colors.black} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(addr.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.addrName}>{addr.fullName}</Text>
              <Text style={styles.addrLine}>{addr.phone}</Text>
              <Text style={styles.addrLine}>{addr.street}</Text>
              <Text style={styles.addrLine}>{addr.city}, {addr.state}</Text>
              {!!addr.landmark && <Text style={styles.addrLandmark}>Near: {addr.landmark}</Text>}
            </View>
          ))
        )}
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color={Colors.cream} />
          <Text style={styles.addBtnText}>ADD NEW ADDRESS</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'EDIT ADDRESS' : 'ADD ADDRESS'}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.black} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              {STRING_FIELDS.map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form[field.key] as string}
                    onChangeText={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                    keyboardType={field.phone ? 'phone-pad' : 'default'}
                    autoCapitalize="words"
                    placeholderTextColor={Colors.border}
                  />
                </View>
              ))}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Set as default address</Text>
                  <Text style={styles.switchSub}>Used at checkout automatically</Text>
                </View>
                <Switch
                  value={form.isDefault}
                  onValueChange={(v) => setForm((p) => ({ ...p, isDefault: v }))}
                  trackColor={{ false: Colors.border, true: Colors.black }}
                  thumbColor={Colors.cream}
                />
              </View>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE ADDRESS</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '500', color: C.black },
    emptyText: { fontSize: 13, color: C.muted, textAlign: 'center' },
    addrCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: Spacing.md, gap: 3 },
    addrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    addrTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addrNickname: { fontSize: 13, fontWeight: '700', color: C.black, letterSpacing: 0.5 },
    defaultBadge: { backgroundColor: C.black, paddingHorizontal: 6, paddingVertical: 2 },
    defaultBadgeText: { fontSize: 9, fontWeight: '700', color: C.cream, letterSpacing: 1 },
    addrActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    setDefaultText: { fontSize: 11, color: C.black, textDecorationLine: 'underline' },
    addrName: { fontSize: 13, fontWeight: '500', color: C.black },
    addrLine: { fontSize: 13, color: C.muted },
    addrLandmark: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: C.black, paddingVertical: 16,
    },
    addBtnText: { color: C.cream, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.white, maxHeight: '92%' },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: Spacing.md, borderBottomWidth: 1, borderColor: C.border,
    },
    modalTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: C.black },
    formContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 48 },
    formField: { gap: 6 },
    formLabel: { fontSize: 12, fontWeight: '600', color: C.black },
    formInput: {
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 12, paddingVertical: 12,
      fontSize: 14, color: C.black, backgroundColor: C.cream,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    switchLabel: { fontSize: 13, fontWeight: '500', color: C.black },
    switchSub: { fontSize: 11, color: C.muted, marginTop: 2 },
    saveBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: C.cream, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  });
}
