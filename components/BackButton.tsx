import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/lib/theme';

interface Props {
  color?: string;
}

export default function BackButton({ color }: Props) {
  const router = useRouter();
  const Colors = useColors();
  return (
    <Pressable style={styles.btn} onPress={() => router.back()} hitSlop={8}>
      <Feather name="arrow-left" size={22} color={color ?? Colors.black} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4 },
});
