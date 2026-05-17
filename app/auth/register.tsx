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

export default function RegisterScreen() {
  const router = useRouter();
  const { sendOtp, register, signInWithGoogle } = useAuth();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setStep('verify');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !code.trim() || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, code.trim());
      router.replace('/(tabs)/account');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
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
          <Pressable style={styles.backBtn} onPress={() => step === 'verify' ? setStep('email') : router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.logo}>ZIVA</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>
              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.muted}
                    value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                    autoComplete="email" returnKeyType="done" onSubmitEditing={handleSendOtp} />
                </View>
                <Pressable style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleSendOtp} disabled={loading}>
                  {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={styles.primaryBtnText}>SEND CODE</Text>}
                </Pressable>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up instantly</Text>
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
                  <Text style={styles.dividerText}>already have an account?</Text>
                  <View style={styles.dividerLine} />
                </View>
                <Pressable style={styles.secondaryBtn} onPress={() => router.push('/auth/sign-in')}>
                  <Text style={styles.secondaryBtnText}>SIGN IN</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verify & complete</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>VERIFICATION CODE</Text>
                  <TextInput style={[styles.input, styles.codeInput]} placeholder="000000" placeholderTextColor={Colors.muted}
                    value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} returnKeyType="next" />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput style={styles.input} placeholder="Ada Okonkwo" placeholderTextColor={Colors.muted}
                    value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.passwordRow}>
                    <TextInput style={[styles.input, styles.passwordInput]} placeholder="Min. 6 characters"
                      placeholderTextColor={Colors.muted} value={password} onChangeText={setPassword}
                      secureTextEntry={!showPassword} returnKeyType="next" />
                    <Pressable style={styles.showBtn} onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor={Colors.muted}
                    value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword}
                    returnKeyType="done" onSubmitEditing={handleRegister} />
                </View>
                <Pressable style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color={Colors.cream} /> : <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>}
                </Pressable>
                <Pressable onPress={handleSendOtp} style={styles.resendBtn}>
                  <Text style={styles.resendText}>{"Didn't receive a code? Resend"}</Text>
                </Pressable>
              </View>
            </>
          )}
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
    form: { gap: 18 },
    fieldGroup: { gap: 6 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.muted },
    input: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.black },
    codeInput: { fontSize: 22, letterSpacing: 8, textAlign: 'center' },
    passwordRow: { flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1 },
    showBtn: { position: 'absolute', right: 14, paddingVertical: 14 },
    showBtnText: { fontSize: 12, color: C.muted },
    primaryBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: C.cream, fontSize: 13, fontWeight: '600', letterSpacing: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { fontSize: 11, color: C.muted },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.white,
      paddingVertical: 15,
    },
    googleBtnText: { color: C.black, fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },
    secondaryBtn: { borderWidth: 1, borderColor: C.black, paddingVertical: 16, alignItems: 'center' },
    secondaryBtnText: { color: C.black, fontSize: 13, fontWeight: '600', letterSpacing: 2 },
    resendBtn: { alignItems: 'center', paddingVertical: 8 },
    resendText: { fontSize: 12, color: C.muted, textDecorationLine: 'underline' },
  });
}
