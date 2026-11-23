import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// Durações curtas: o movimento orienta, não segura o usuário.
export const DURATION = { fast: 160, base: 260, slow: 420 };
export const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

// Respeita "Reduzir movimento" do iOS / "Remover animações" do Android.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub?.remove?.();
  }, []);
  return reduced;
}

// Entrada em cascata de cards e blocos: mostra a ordem de leitura.
export function useEntrance(index = 0) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: DURATION.base,
      delay: Math.min(index, 8) * 50,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  }, [reduced]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
}

// Pulso usado quando o status de um relato muda (feedback de mudança de estado).
export function usePulse(trigger) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: DURATION.fast, useNativeDriver: true }),
      Animated.spring(v, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [trigger]);
  return { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] };
}
