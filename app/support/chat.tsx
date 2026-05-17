import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/AuthContext';
import { useColors, Spacing } from '@/lib/theme';
import { api, ApiChat, ApiChatMessage } from '@/lib/api';

const CHAT_ID_KEY = 'ziva_support_chat_id';

type Phase = 'loading' | 'form' | 'chat';

const fmt = (ts: string) =>
  new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

export default function ChatScreen() {
  const { user } = useAuth();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [chatId, setChatId] = useState<string | null>(null);
  const [chat, setChat] = useState<ApiChat | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formText, setFormText] = useState('');
  const [starting, setStarting] = useState(false);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadChat = useCallback(async (id: string, markRead = false): Promise<ApiChat | null> => {
    try {
      const res = await api.chats.get(id, markRead);
      setChat(res.chat);
      return res.chat;
    } catch {
      return null;
    }
  }, []);

  const userName = user?.name ?? '';
  const userEmail = user?.email ?? '';

  useEffect(() => {
    async function init() {
      if (userName) setFormName(userName);
      if (userEmail) setFormEmail(userEmail);

      const storedId = await AsyncStorage.getItem(CHAT_ID_KEY);
      if (storedId) {
        setChatId(storedId);
        const loaded = await loadChat(storedId, true);
        if (loaded) {
          setPhase('chat');
          pollRef.current = setInterval(() => loadChat(storedId, false), 6000);
        } else {
          await AsyncStorage.removeItem(CHAT_ID_KEY);
          setPhase('form');
        }
      } else {
        setPhase('form');
      }
    }
    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadChat, userName, userEmail]);

  const handleStart = async () => {
    if (!formName.trim() || !formText.trim()) {
      Alert.alert('Required', 'Please enter your name and a message.');
      return;
    }
    setStarting(true);
    try {
      const res = await api.chats.start(formName.trim(), formEmail.trim(), formText.trim());
      await AsyncStorage.setItem(CHAT_ID_KEY, res.chatId);
      setChatId(res.chatId);
      await loadChat(res.chatId, true);
      setPhase('chat');
      pollRef.current = setInterval(() => loadChat(res.chatId, false), 6000);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to start chat.');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async () => {
    if (!chatId || !input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const optimistic: ApiChatMessage = { from: 'customer', text, timestamp: new Date().toISOString() };
    setChat((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
    try {
      await api.chats.sendMessage(chatId, text);
      await loadChat(chatId, true);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    Alert.alert('New Conversation', 'Start a fresh conversation? Your previous chat stays on our end.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start New', onPress: async () => {
          if (pollRef.current) clearInterval(pollRef.current);
          await AsyncStorage.removeItem(CHAT_ID_KEY);
          setChatId(null);
          setChat(null);
          setInput('');
          setFormText('');
          setPhase('form');
        },
      },
    ]);
  };

  useEffect(() => {
    if (chat?.messages?.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [chat?.messages?.length]);

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}><ActivityIndicator size="large" color={Colors.black} /></View>
      </SafeAreaView>
    );
  }

  if (phase === 'form') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          <View style={styles.statusBar}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>ZIVA Customer Support</Text>
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.formIntro}>
              <View style={styles.formAvatar}><Text style={styles.formAvatarText}>Z</Text></View>
              <Text style={styles.formIntroTitle}>Hi there!</Text>
              <Text style={styles.formIntroSub}>Start a conversation with our support team. We typically reply within a few hours.</Text>
            </View>

            <Text style={styles.fieldLabel}>Your Name *</Text>
            <TextInput
              style={styles.fieldInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Full name"
              placeholderTextColor={Colors.muted}
            />

            <Text style={styles.fieldLabel}>Email (optional)</Text>
            <TextInput
              style={styles.fieldInput}
              value={formEmail}
              onChangeText={setFormEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Your Message *</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextarea]}
              value={formText}
              onChangeText={setFormText}
              placeholder="How can we help you?"
              placeholderTextColor={Colors.muted}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              style={[styles.startBtn, (starting || !formName.trim() || !formText.trim()) && { opacity: 0.5 }]}
              onPress={handleStart}
              disabled={starting || !formName.trim() || !formText.trim()}
            >
              {starting
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.startBtnText}>START CONVERSATION</Text>
              }
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const messages = chat?.messages ?? [];
  const isClosed = chat?.status === 'closed';

  const renderItem = ({ item }: { item: ApiChatMessage }) => {
    const isCustomer = item.from === 'customer';
    return (
      <View style={[styles.msgRow, isCustomer && styles.msgRowUser]}>
        {!isCustomer && (
          <View style={styles.avatar}><Text style={styles.avatarText}>Z</Text></View>
        )}
        <View style={[styles.bubble, isCustomer ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isCustomer && styles.bubbleTextUser]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isCustomer && styles.bubbleTimeUser]}>{fmt(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <View style={styles.statusBar}>
          <View style={[styles.onlineDot, isClosed && styles.closedDot]} />
          <Text style={styles.statusText}>ZIVA Support · {isClosed ? 'Closed' : 'Online'}</Text>
          <Pressable style={styles.newChatBtn} onPress={handleNewChat}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.muted} />
            <Text style={styles.newChatText}>New chat</Text>
          </Pressable>
        </View>

        {isClosed && (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed-outline" size={13} color="#92400E" />
            <Text style={styles.closedBannerText}>This conversation has been closed by our team.</Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={Colors.border} />
              <Text style={styles.emptyText}>Message sent! Our team will reply shortly.</Text>
            </View>
          }
        />

        {!isClosed && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message…"
              placeholderTextColor={Colors.muted}
              value={input}
              onChangeText={setInput}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color={Colors.cream} />
                : <Ionicons name="send" size={18} color={Colors.cream} />
              }
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg },
    emptyText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },

    statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
    closedDot: { backgroundColor: '#9CA3AF' },
    statusText: { flex: 1, fontSize: 12, color: C.muted, fontWeight: '500' },
    newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    newChatText: { fontSize: 12, color: C.muted },

    closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#FDE68A' },
    closedBannerText: { fontSize: 12, color: '#92400E', flex: 1 },

    list: { padding: Spacing.md, gap: 12, paddingBottom: 8 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    msgRowUser: { flexDirection: 'row-reverse' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarText: { color: C.cream, fontSize: 12, fontWeight: '700' },
    bubble: { maxWidth: '75%', padding: 12, gap: 4, borderRadius: 2 },
    bubbleBot: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    bubbleUser: { backgroundColor: C.black },
    bubbleText: { fontSize: 14, color: C.black, lineHeight: 20 },
    bubbleTextUser: { color: C.cream },
    bubbleTime: { fontSize: 10, color: C.muted, alignSelf: 'flex-end' },
    bubbleTimeUser: { color: 'rgba(255,255,255,0.5)' },

    inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
    textInput: { flex: 1, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.black, maxHeight: 100 },
    sendBtn: { width: 44, height: 44, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: C.border },

    formContent: { padding: Spacing.md, paddingBottom: 40 },
    formIntro: { alignItems: 'center', paddingVertical: 32, gap: 10 },
    formAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.black, alignItems: 'center', justifyContent: 'center' },
    formAvatarText: { color: C.cream, fontSize: 28, fontWeight: '700' },
    formIntroTitle: { fontSize: 20, fontWeight: '600', color: C.black },
    formIntroSub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
    fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: C.muted, marginBottom: 6, marginTop: 14 },
    fieldInput: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.black },
    fieldTextarea: { height: 100, textAlignVertical: 'top' },
    startBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    startBtnText: { color: C.cream, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  });
}
