import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors, Spacing } from '@/lib/theme';

const FAQS = [
  { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days within Lagos and 5–7 business days for other states in Nigeria. Express delivery (1–2 days) is available at checkout.' },
  { q: 'Can I return or exchange an item?', a: 'Yes! We offer free returns within 14 days of delivery for unworn items in their original condition. Visit your Orders page to initiate a return.' },
  { q: 'How do I find my correct size?', a: 'Each product page includes a size guide. If you are between sizes, we recommend going a size up. You can also request custom tailoring for a perfect fit.' },
  { q: 'Is custom tailoring available?', a: 'Yes! We offer custom tailoring on request for most products. Contact us via chat or email with your measurements and we will create a bespoke piece for you.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major debit and credit cards, bank transfers, and USSD via Paystack. Your payment details are fully encrypted and secure.' },
  { q: 'How do I track my order?', a: 'Once your order ships, you will receive an SMS and email with a tracking link. You can also view order status in the My Orders section of your account.' },
  { q: 'Do you ship internationally?', a: 'Yes! We ship to the UK, USA, Canada, and several European countries. International delivery takes 7–14 business days. Duties and taxes may apply.' },
  { q: 'How do I care for my Ankara or Aso-Oke fabric?', a: "Hand wash in cold water with mild detergent, or dry clean. Avoid tumble drying. Iron inside-out on a low setting to preserve the fabric's colour and texture." },
];

export default function SupportScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.contactGrid}>
          <Pressable style={styles.contactCard} onPress={() => router.push('/support/chat')}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.black} />
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSub}>We reply in minutes</Text>
          </Pressable>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@ziva.com')}>
            <Ionicons name="mail-outline" size={24} color={Colors.black} />
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactSub}>support@ziva.com</Text>
          </Pressable>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL('https://wa.me/2348000000000')}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.contactTitle}>WhatsApp</Text>
            <Text style={styles.contactSub}>Mon–Sat, 8am–6pm</Text>
          </Pressable>
          <Pressable style={styles.contactCard} onPress={() => Linking.openURL('tel:+2348000000000')}>
            <Ionicons name="call-outline" size={24} color={Colors.black} />
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>+234 800 000 0000</Text>
          </Pressable>
        </View>

        <Pressable style={styles.chatBanner} onPress={() => router.push('/support/chat')}>
          <View style={styles.chatBannerLeft}>
            <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            <View>
              <Text style={styles.chatBannerTitle}>Chat with us now</Text>
              <Text style={styles.chatBannerSub}>Average response time: 2 minutes</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, i) => (
            <Pressable key={i} style={[styles.faqItem, i < FAQS.length - 1 && styles.faqBorder]} onPress={() => toggle(i)}>
              <View style={styles.faqRow}>
                <Text style={styles.faqQ}>{faq.q}</Text>
                <Ionicons name={openIndex === i ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.muted} />
              </View>
              {openIndex === i && <Text style={styles.faqA}>{faq.a}</Text>}
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>ZIVA Fashion · Lagos, Nigeria · © 2025</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: 0, paddingBottom: 40 },
    sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: C.muted, marginTop: Spacing.md, marginBottom: 12 },
    contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    contactCard: { flex: 1, minWidth: '45%', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: Spacing.md, alignItems: 'center', gap: 8 },
    contactTitle: { fontSize: 13, fontWeight: '500', color: C.black },
    contactSub: { fontSize: 11, color: C.muted, textAlign: 'center' },
    chatBanner: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: '#1C1C1C', padding: Spacing.md, marginBottom: Spacing.md, gap: 12,
    },
    chatBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chatBannerTitle: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },
    chatBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    faqList: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, marginBottom: Spacing.xl },
    faqItem: { padding: Spacing.md, gap: 10 },
    faqBorder: { borderBottomWidth: 1, borderColor: C.border },
    faqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    faqQ: { flex: 1, fontSize: 14, color: C.black, fontWeight: '400', lineHeight: 20 },
    faqA: { fontSize: 13, color: C.muted, lineHeight: 20 },
    footer: { textAlign: 'center', fontSize: 11, color: C.border },
  });
}
