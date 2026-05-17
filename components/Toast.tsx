import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'error' | 'success' | 'info';

export interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'error' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(message: string, type: ToastType = 'error') {
    if (timer.current) clearTimeout(timer.current);
    setToast({ visible: true, message, type });
    timer.current = setTimeout(() => setToast((s) => ({ ...s, visible: false })), 2800);
  }

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState }) {
  const ty = useRef(new Animated.Value(80)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(ty, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(ty, { toValue: 80, duration: 220, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [toast.visible]);

  const icon =
    toast.type === 'success' ? 'checkmark-circle' :
    toast.type === 'info'    ? 'information-circle' :
                               'alert-circle';
  const iconColor =
    toast.type === 'success' ? '#22C55E' :
    toast.type === 'info'    ? '#3B82F6' :
                               '#EF4444';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { transform: [{ translateY: ty }], opacity: op }]}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.msg}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  msg: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
});
