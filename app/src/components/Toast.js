import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';
import { DURATION, EASE_OUT, useReducedMotion } from '../lib/motion';

// Aviso que desliza do topo: retorno imediato sobre ações em segundo plano
// (envio da fila offline, apoio registrado, mudança de status).
export default function Toast() {
  const { toast, setToast } = useApp();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    const show = Animated.timing(y, { toValue: 1, duration: reduced ? 0 : DURATION.base, easing: EASE_OUT, useNativeDriver: true });
    const hide = Animated.timing(y, { toValue: 0, duration: reduced ? 0 : DURATION.fast, useNativeDriver: true });
    show.start();
    const t = setTimeout(() => hide.start(() => setToast(null)), 3500);
    return () => clearTimeout(t);
  }, [toast?.key]);

  if (!toast) return null;
  const tone = TONES[toast.tone] || TONES.info;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { top: insets.top + 8, backgroundColor: tone.bg },
        {
          opacity: y,
          transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
        },
      ]}
    >
      <Ionicons name={tone.icon} size={22} color={colors.white} />
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const TONES = {
  info: { bg: colors.primaryDark, icon: 'information-circle' },
  success: { bg: '#126B33', icon: 'checkmark-circle' },
  warn: { bg: '#7A3A05', icon: 'cloud-offline' },
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  text: { color: colors.white, fontSize: 16, fontWeight: '600', flex: 1 },
});
