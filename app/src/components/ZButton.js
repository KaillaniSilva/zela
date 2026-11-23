import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, TOUCH } from '../lib/theme';
import { useReducedMotion } from '../lib/motion';

// Botão padrão: área de toque >= 56dp, rótulo para leitor de tela,
// microinteração de "afundar" ao tocar + vibração leve como confirmação.
export default function ZButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  accessibilityHint,
  style,
  size = 'md',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const v = VARIANTS[variant];

  const animate = (to) => {
    if (reduced) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        disabled={disabled || loading}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={[
          styles.base,
          size === 'lg' && styles.lg,
          { backgroundColor: v.bg, borderColor: v.border },
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={size === 'lg' ? 26 : 22} color={v.fg} />}
            <Text style={[styles.label, size === 'lg' && styles.labelLg, { color: v.fg }]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  accent: { bg: colors.accent, fg: colors.text, border: colors.accent },
  secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: { minHeight: 72, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 17, fontWeight: '700' },
  labelLg: { fontSize: 20 },
  disabled: { opacity: 0.5 },
});
