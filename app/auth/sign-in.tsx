import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { useColors, Spacing } from '@/lib/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/account');
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/account');
    } catch (e: any) {
      Alert.alert('Google Sign In Failed', e.message ?? 'Could not sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.logo}>ZIVA</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to access your orders and wishlist</Text>
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <Pressable style={styles.showBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={styles.primaryBtnText}>SIGN IN</Text>}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <Pressable
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.black} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.googleBtnText}>CONTINUE WITH GOOGLE</Text>
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>no account?</Text>
              <View style={styles.dividerLine} />
            </View>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/auth/register')}>
              <Text style={styles.secondaryBtnText}>CREATE AN ACCOUNT</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    container: { flexGrow: 1, padding: Spacing.lg },
    backBtn: { alignSelf: 'flex-start', marginBottom: Spacing.xl },
    backText: { fontSize: 14, color: C.muted },
    logo: { fontSize: 28, fontWeight: '300', letterSpacing: 10, color: C.black, marginBottom: Spacing.lg },
    title: { fontSize: 26, fontWeight: '300', color: C.black, marginBottom: 8 },
    subtitle: { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: Spacing.xl },
    form: { gap: 20 },
    fieldGroup: { gap: 6 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.muted },
    input: {
      borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
      paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.black,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1 },
    showBtn: { position: 'absolute', right: 14, paddingVertical: 14 },
    showBtnText: { fontSize: 12, color: C.muted },
    primaryBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: C.cream, fontSize: 13, fontWeight: '600', letterSpacing: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { fontSize: 12, color: C.muted },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
      paddingVertical: 15,
    },
    googleBtnText: { color: C.black, fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },
    secondaryBtn: { borderWidth: 1, borderColor: C.black, paddingVertical: 16, alignItems: 'center' },
    secondaryBtnText: { color: C.black, fontSize: 13, fontWeight: '600', letterSpacing: 2 },
  });
}
