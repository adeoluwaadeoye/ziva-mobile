import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors, Spacing } from '@/lib/theme';
import { useAuth } from '@/lib/AuthContext';

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel: string;
  onPress: () => void;
  adminOnly?: boolean;
}

export default function AccountScreen() {
  const { user, isAdmin, signOut, updateProfile, adminLogin, adminLogout } = useAuth();
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: 'receipt-outline', label: 'My Orders', sublabel: 'Track and manage orders', onPress: () => router.push('/orders') },
    { icon: 'heart-outline', label: 'Wishlist', sublabel: 'Saved items', onPress: () => router.push('/wishlist') },
    { icon: 'resize-outline', label: 'My Measurements', sublabel: 'Saved body measurements', onPress: () => router.push('/measurements') },
    { icon: 'location-outline', label: 'Delivery Addresses', sublabel: 'Manage saved addresses', onPress: () => router.push('/addresses') },
    { icon: 'notifications-outline', label: 'Notifications', sublabel: 'Push & email preferences', onPress: () => router.push('/notifications') },
    { icon: 'help-circle-outline', label: 'Help & Support', sublabel: 'FAQs, live chat, contact', onPress: () => router.push('/support') },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', sublabel: 'Password, data & account', onPress: () => router.push('/privacy') },
    { icon: 'grid-outline', label: 'Admin Panel', sublabel: 'Manage products and orders', onPress: () => router.push('/admin'), adminOnly: true },
    {
      icon: 'information-circle-outline', label: 'About Ziva', sublabel: 'Version 1.0.0',
      onPress: () => Alert.alert('About ZIVA', 'ZIVA Fashion v1.0.0\n\nHandcrafted by master artisans, celebrating Nigerian heritage with global reach.\n\n© 2025 ZIVA Fashion'),
    },
  ];

  const visibleItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleSaveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try {
      await updateProfile(nameVal.trim());
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message ?? 'Could not update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return;
    setAdminLoading(true);
    try {
      await adminLogin(adminPassword.trim());
      setAdminModalVisible(false);
      setAdminPassword('');
      Alert.alert('Admin Access', 'You now have admin access.');
    } catch (e: any) {
      Alert.alert('Access Denied', e.message ?? 'Incorrect password.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogout = () => {
    Alert.alert('Exit Admin Mode', 'Remove admin access from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => adminLogout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          {isAdmin && (
            <Pressable onPress={handleAdminLogout}>
              <View style={styles.adminBadgePill}>
                <Text style={styles.adminBadgePillText}>ADMIN</Text>
              </View>
            </Pressable>
          )}
        </View>

        {user ? (
          <View style={styles.profileCard}>
            <View style={[styles.avatar, isAdmin && styles.avatarAdmin]}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>

            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameVal}
                  onChangeText={setNameVal}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <Pressable
                  style={[styles.editActionBtn, styles.editSaveBtn]}
                  onPress={handleSaveName}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </Pressable>
                <Pressable
                  style={[styles.editActionBtn, styles.editCancelBtn]}
                  onPress={() => { setEditing(false); setNameVal(user.name); }}
                >
                  <Ionicons name="close" size={16} color={Colors.black} />
                </Pressable>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            )}

            {!editing && (
              <Pressable
                style={styles.editIconBtn}
                onPress={() => { setEditing(true); setNameVal(user.name); }}
              >
                <Ionicons name="pencil-outline" size={16} color={Colors.muted} />
              </Pressable>
            )}

            {isAdmin && !editing && (
              <Pressable style={styles.adminPanelBtn} onPress={() => router.push('/admin')}>
                <Ionicons name="grid-outline" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Join Ziva</Text>
            <Text style={styles.authSubtitle}>Sign in to access your orders, wishlist, and saved measurements.</Text>
            <View style={styles.authButtons}>
              <Pressable style={styles.signInBtn} onPress={() => router.push('/auth/sign-in')}>
                <Text style={styles.signInText}>SIGN IN</Text>
              </Pressable>
              <Pressable style={styles.registerBtn} onPress={() => router.push('/auth/register')}>
                <Text style={styles.registerText}>CREATE ACCOUNT</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {visibleItems.map((item, idx) => (
            <Pressable
              key={item.label}
              style={[styles.menuItem, idx < visibleItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, item.adminOnly && styles.menuIconAdmin]}>
                <Ionicons name={item.icon} size={20} color={item.adminOnly ? '#FFFFFF' : Colors.black} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.border} />
            </Pressable>
          ))}
        </View>

        {user && (
          <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        )}

        {!isAdmin && (
          <Pressable style={styles.adminAccessBtn} onPress={() => setAdminModalVisible(true)}>
            <Text style={styles.adminAccessText}>Admin Access</Text>
          </Pressable>
        )}

        <Text style={styles.footer}>© 2025 ZIVA Fashion. All rights reserved.</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={adminModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalBg} onPress={() => { setAdminModalVisible(false); setAdminPassword(''); }}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>ADMIN ACCESS</Text>
            <Text style={styles.modalSubtitle}>Enter your admin password to unlock admin features</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Admin password"
              placeholderTextColor={Colors.muted}
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleAdminLogin}
            />
            <Pressable style={[styles.modalBtn, adminLoading && { opacity: 0.6 }]} onPress={handleAdminLogin} disabled={adminLoading}>
              {adminLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalBtnText}>UNLOCK</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.border },
    title: { fontSize: 20, fontWeight: '300', letterSpacing: 2, color: C.black },
    adminBadgePill: { backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 4 },
    adminBadgePillText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
    authCard: { margin: Spacing.md, backgroundColor: C.white, padding: Spacing.lg, borderWidth: 1, borderColor: C.border, gap: 12 },
    authTitle: { fontSize: 20, fontWeight: '400', color: C.black, letterSpacing: 0.5 },
    authSubtitle: { fontSize: 13, color: C.muted, lineHeight: 20 },
    authButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
    signInBtn: { flex: 1, backgroundColor: C.black, paddingVertical: 12, alignItems: 'center' },
    signInText: { color: C.cream, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },
    registerBtn: { flex: 1, borderWidth: 1, borderColor: C.black, paddingVertical: 12, alignItems: 'center' },
    registerText: { color: C.black, fontSize: 12, letterSpacing: 1.5, fontWeight: '600' },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: Spacing.md, backgroundColor: C.white, padding: Spacing.md, borderWidth: 1, borderColor: C.border },
    avatar: { width: 52, height: 52, backgroundColor: '#1C1C1C', borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarAdmin: { backgroundColor: '#7C3AED' },
    avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
    profileName: { fontSize: 16, fontWeight: '500', color: C.black },
    profileEmail: { fontSize: 12, color: C.muted, marginTop: 2 },
    editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    nameInput: {
      flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream,
      paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.black,
    },
    editActionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    editSaveBtn: { backgroundColor: C.black },
    editCancelBtn: { borderWidth: 1, borderColor: C.border },
    editIconBtn: { padding: 6 },
    adminPanelBtn: { width: 38, height: 38, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
    menuSection: { marginHorizontal: Spacing.md, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, marginTop: Spacing.sm },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 12 },
    menuItemBorder: { borderBottomWidth: 1, borderColor: C.border },
    menuIcon: { width: 36, height: 36, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
    menuIconAdmin: { backgroundColor: '#7C3AED' },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: 14, color: C.black, fontWeight: '400' },
    menuSublabel: { fontSize: 11, color: C.muted, marginTop: 1 },
    logoutBtn: { margin: Spacing.md, marginTop: Spacing.lg, borderWidth: 1, borderColor: '#EF4444', paddingVertical: 14, alignItems: 'center' },
    logoutText: { color: '#EF4444', fontSize: 13, letterSpacing: 1, fontWeight: '600' },
    adminAccessBtn: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: 8, paddingHorizontal: 16 },
    adminAccessText: { fontSize: 11, color: C.border, textDecorationLine: 'underline' },
    footer: { textAlign: 'center', fontSize: 11, color: C.border, marginTop: Spacing.lg },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: C.white, paddingBottom: 40, paddingTop: 12, paddingHorizontal: Spacing.md, gap: 14 },
    modalHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: C.black },
    modalSubtitle: { fontSize: 13, color: C.muted, lineHeight: 20 },
    modalInput: { borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.black },
    modalBtn: { backgroundColor: '#7C3AED', paddingVertical: 14, alignItems: 'center' },
    modalBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 2 },
  });
}
