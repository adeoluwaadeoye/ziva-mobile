import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing } from '@/lib/theme';
import { useAuth } from '@/lib/AuthContext';

export default function PrivacyScreen() {
  const { user, changePassword, deleteAccount } = useAuth();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [biometric, setBiometric] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [personalisation, setPersonalisation] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwModalVisible(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not update password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download My Data',
      'We will prepare a copy of your account data and email it to ' + (user?.email ?? 'your registered email') + ' within 48 hours.',
      [{ text: 'Request', onPress: () => Alert.alert('Requested', 'Your data export request has been submitted.') }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your ZIVA account, order history, saved addresses, and measurements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            Alert.alert('Are you absolutely sure?', 'This action is irreversible.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, delete my account', style: 'destructive', onPress: async () => {
                  setDeleteLoading(true);
                  try {
                    await deleteAccount();
                  } catch (e: any) {
                    setDeleteLoading(false);
                    Alert.alert('Error', e.message ?? 'Could not delete account. Please try again.');
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {deleteLoading && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.deletingText}>Deleting account…</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>ACCOUNT SECURITY</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setPwModalVisible(true)}>
            <View style={styles.iconBox}><Ionicons name="key-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowSub}>Update your login password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </Pressable>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconBox}><Ionicons name="finger-print-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Biometric Login</Text>
              <Text style={styles.rowSub}>Use Face ID or Touch ID to sign in</Text>
            </View>
            <Switch value={biometric} onValueChange={setBiometric} trackColor={{ false: Colors.border, true: Colors.black }} thumbColor={Colors.cream} />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconBox}><Ionicons name="notifications-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Login Alerts</Text>
              <Text style={styles.rowSub}>Notify when a new sign-in is detected</Text>
            </View>
            <Switch value={loginAlerts} onValueChange={setLoginAlerts} trackColor={{ false: Colors.border, true: Colors.black }} thumbColor={Colors.cream} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}><Ionicons name="sparkles-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Personalised Recommendations</Text>
              <Text style={styles.rowSub}>Show products based on your browsing and orders</Text>
            </View>
            <Switch value={personalisation} onValueChange={setPersonalisation} trackColor={{ false: Colors.border, true: Colors.black }} thumbColor={Colors.cream} />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconBox}><Ionicons name="bar-chart-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Analytics & Improvement</Text>
              <Text style={styles.rowSub}>Help us improve the app with usage data</Text>
            </View>
            <Switch value={analytics} onValueChange={setAnalytics} trackColor={{ false: Colors.border, true: Colors.black }} thumbColor={Colors.cream} />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconBox}><Ionicons name="mail-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Marketing Emails</Text>
              <Text style={styles.rowSub}>Receive promotions and sale alerts via email</Text>
            </View>
            <Switch value={marketingEmails} onValueChange={setMarketingEmails} trackColor={{ false: Colors.border, true: Colors.black }} thumbColor={Colors.cream} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>YOUR DATA</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={handleDownloadData}>
            <View style={styles.iconBox}><Ionicons name="download-outline" size={18} color={Colors.black} /></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Download My Data</Text>
              <Text style={styles.rowSub}>Request a copy of your account data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </Pressable>
          <Pressable style={[styles.row, styles.rowBorder]} onPress={handleDeleteAccount}>
            <View style={[styles.iconBox, styles.iconBoxDanger]}><Ionicons name="trash-outline" size={18} color={Colors.danger} /></View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.rowSub}>Permanently remove your account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
          </Pressable>
        </View>

        <Text style={styles.note}>
          ZIVA takes your privacy seriously. We never sell your personal data to third parties.{' '}
          <Text style={styles.noteLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>

      <Modal visible={pwModalVisible} animationType="slide" transparent onRequestClose={() => setPwModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPwModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CHANGE PASSWORD</Text>
              <Pressable onPress={() => setPwModalVisible(false)}><Ionicons name="close" size={22} color={Colors.black} /></Pressable>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput style={styles.input} placeholder="Enter current password" placeholderTextColor={Colors.muted} secureTextEntry value={currentPw} onChangeText={setCurrentPw} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput style={styles.input} placeholder="Minimum 6 characters" placeholderTextColor={Colors.muted} secureTextEntry value={newPw} onChangeText={setNewPw} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput style={styles.input} placeholder="Re-enter new password" placeholderTextColor={Colors.muted} secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
            </View>
            <Pressable style={[styles.saveBtn, pwLoading && styles.saveBtnDisabled]} onPress={handleChangePassword} disabled={pwLoading}>
              {pwLoading
                ? <ActivityIndicator color={Colors.cream} />
                : <Text style={styles.saveBtnText}>UPDATE PASSWORD</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: 0, paddingBottom: 40 },
    deletingOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99,
      alignItems: 'center', justifyContent: 'center', gap: 16,
    },
    deletingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
    sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: C.muted, marginTop: Spacing.md, marginBottom: 10 },
    card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, marginBottom: Spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 12 },
    rowBorder: { borderTopWidth: 1, borderColor: C.border },
    iconBox: { width: 36, height: 36, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    iconBoxDanger: { backgroundColor: '#FEF2F2' },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 14, color: C.black, fontWeight: '400' },
    rowSub: { fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 16 },
    dangerText: { color: C.danger },
    note: { fontSize: 12, color: C.muted, lineHeight: 18, marginTop: Spacing.md, textAlign: 'center' },
    noteLink: { textDecorationLine: 'underline', color: C.black },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { backgroundColor: C.white, padding: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.md },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    modalTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: C.black },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: C.black, letterSpacing: 0.3 },
    input: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.black, backgroundColor: C.cream },
    saveBtn: { backgroundColor: C.black, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.sm },
    saveBtnDisabled: { backgroundColor: C.muted },
    saveBtnText: { color: C.cream, fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },
  });
}
