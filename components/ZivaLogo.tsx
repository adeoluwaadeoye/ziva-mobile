import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
}

export default function ZivaLogo({ variant = 'dark', size = 'md' }: Props) {
  const ink = variant === 'dark' ? '#1A1A1A' : '#FFFFFF';
  const iconClr = variant === 'dark' ? 'rgba(26,26,26,0.65)' : 'rgba(255,255,255,0.70)';
  const sep = variant === 'dark' ? 'rgba(26,26,26,0.15)' : 'rgba(255,255,255,0.20)';
  const line = variant === 'dark' ? 'rgba(26,26,26,0.28)' : 'rgba(255,255,255,0.35)';
  const diamond = variant === 'dark' ? 'rgba(26,26,26,0.32)' : 'rgba(255,255,255,0.42)';
  const muted = variant === 'dark' ? 'rgba(26,26,26,0.45)' : 'rgba(255,255,255,0.55)';

  const iconSize = size === 'sm' ? 20 : 26;
  const titleSize = size === 'sm' ? 14 : 18;
  const titleTracking = size === 'sm' ? 4 : 6;
  const subSize = size === 'sm' ? 6 : 7;
  const subTracking = size === 'sm' ? 3 : 4;

  return (
    <View style={styles.row}>
      <Ionicons
        name="cut-outline"
        size={iconSize}
        color={iconClr}
        style={{ transform: [{ rotate: '90deg' }] }}
      />
      <View style={[styles.sep, { backgroundColor: sep }]} />
      <View>
        <Text style={{ fontSize: titleSize, letterSpacing: titleTracking, color: ink, fontWeight: '700', lineHeight: titleSize + 3 }}>
          ZIVA
        </Text>
        <View style={[styles.dividerRow, { alignSelf: 'stretch' }]}>
          <View style={[styles.line, { backgroundColor: line }]} />
          <Text style={{ fontSize: 5, color: diamond, marginHorizontal: 3, lineHeight: 8 }}>◆</Text>
          <View style={[styles.line, { backgroundColor: line }]} />
        </View>
        <Text style={{ fontSize: subSize, letterSpacing: subTracking, color: muted, fontWeight: '600' }}>
          NIGERIA
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sep: { width: 1, alignSelf: 'stretch' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
