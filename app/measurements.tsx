import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Spacing } from '@/lib/theme';
import { useUserData, Measurements } from '@/lib/UserDataContext';

const FIELDS: { key: keyof Measurements; label: string; hint: string }[] = [
  { key: 'chest',      label: 'Chest / Bust',    hint: 'Around the fullest part of your chest' },
  { key: 'waist',      label: 'Waist',            hint: 'Around the narrowest part of your torso' },
  { key: 'hips',       label: 'Hips',             hint: 'Around the fullest part of your hips' },
  { key: 'shoulder',   label: 'Shoulder Width',   hint: 'Across the back from shoulder to shoulder' },
  { key: 'armLength',  label: 'Arm Length',       hint: 'From shoulder tip to wrist' },
  { key: 'bodyLength', label: 'Body Length',      hint: 'From top of shoulder to floor' },
  { key: 'inseam',     label: 'Inseam',           hint: 'From crotch to ankle' },
];

export default function MeasurementsScreen() {
  const { measurements, saveMeasurements } = useUserData();
  const hasData = Object.values(measurements).some(Boolean);
  const [editing, setEditing] = useState(!hasData);
  const [form, setForm] = useState<Measurements>(measurements);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const handleSave = () => {
    saveMeasurements(form);
    setEditing(false);
    Alert.alert('Saved', 'Your measurements have been saved.');
  };

  const handleCancel = () => {
    setForm(measurements);
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Accurate measurements help us recommend the right fit and enable custom tailoring.
          All measurements are in centimetres (cm).
        </Text>
        <View style={styles.card}>
          {FIELDS.map((f, i) =>
            editing ? (
              <View key={f.key} style={[styles.fieldBlock, i < FIELDS.length - 1 && styles.rowBorder]}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <Text style={styles.fieldHint}>{f.hint}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={form[f.key]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.border}
                  />
                  <Text style={styles.unit}>cm</Text>
                </View>
              </View>
            ) : (
              <View key={f.key} style={[styles.displayRow, i < FIELDS.length - 1 && styles.rowBorder]}>
                <Text style={styles.displayLabel}>{f.label}</Text>
                <Text style={styles.displayValue}>
                  {measurements[f.key] ? `${measurements[f.key]} cm` : '—'}
                </Text>
              </View>
            )
          )}
        </View>
        <View style={styles.actions}>
          {editing ? (
            <>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE MEASUREMENTS</Text>
              </Pressable>
              {hasData && (
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>EDIT MEASUREMENTS</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
    intro: { fontSize: 13, color: C.muted, lineHeight: 20 },
    card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
    rowBorder: { borderBottomWidth: 1, borderColor: C.border },
    displayRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: 14,
    },
    displayLabel: { fontSize: 13, color: C.black },
    displayValue: { fontSize: 13, fontWeight: '600', color: C.black },
    fieldBlock: { padding: Spacing.md, gap: 4 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.black },
    fieldHint: { fontSize: 11, color: C.muted },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    input: {
      flex: 1, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 14, color: C.black, backgroundColor: C.cream,
    },
    unit: { fontSize: 13, color: C.muted, width: 24 },
    actions: { gap: 10 },
    saveBtn: { backgroundColor: C.black, paddingVertical: 16, alignItems: 'center' },
    saveBtnText: { color: C.cream, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
    editBtn: { borderWidth: 1, borderColor: C.black, paddingVertical: 16, alignItems: 'center' },
    editBtnText: { color: C.black, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: C.muted, fontSize: 13 },
  });
}
