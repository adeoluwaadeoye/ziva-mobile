import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Spacing } from '@/lib/theme';
import { useUserData, NotificationPrefs } from '@/lib/UserDataContext';

const PREFS: { key: keyof NotificationPrefs; label: string; sub: string }[] = [
  { key: 'orderUpdates', label: 'Order Updates',       sub: 'Shipping confirmations, delivery and status changes' },
  { key: 'promotions',   label: 'Promotions & Offers', sub: 'Exclusive deals, flash sales, and discount codes' },
  { key: 'newArrivals',  label: 'New Arrivals',        sub: 'Be first to know when new collections drop' },
  { key: 'restock',      label: 'Restock Alerts',      sub: 'Notify when out-of-stock items are available again' },
  { key: 'priceDrop',    label: 'Price Drops',         sub: 'When items in your wishlist go on sale' },
];

export default function NotificationsScreen() {
  const { notificationPrefs, setNotificationPref } = useUserData();
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Choose what updates you receive via push notification and email.
        </Text>
        <View style={styles.card}>
          {PREFS.map((pref, i) => (
            <View key={pref.key} style={[styles.prefRow, i < PREFS.length - 1 && styles.rowBorder]}>
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>{pref.label}</Text>
                <Text style={styles.prefSub}>{pref.sub}</Text>
              </View>
              <Switch
                value={notificationPrefs[pref.key]}
                onValueChange={(v) => setNotificationPref(pref.key, v)}
                trackColor={{ false: Colors.border, true: Colors.black }}
                thumbColor={Colors.cream}
              />
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          You can also manage notification permissions in your device Settings app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
    intro: { fontSize: 13, color: C.muted, lineHeight: 20 },
    card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    prefRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: 16, gap: 12,
    },
    rowBorder: { borderBottomWidth: 1, borderColor: C.border },
    prefInfo: { flex: 1 },
    prefLabel: { fontSize: 14, color: C.black },
    prefSub: { fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 17 },
    note: { fontSize: 12, color: C.muted, lineHeight: 18 },
  });
}
