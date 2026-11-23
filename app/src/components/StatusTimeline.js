import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, STATUS, STEPS } from '../lib/theme';
import { DURATION, EASE_OUT, useReducedMotion } from '../lib/motion';
import { timeAgo } from '../lib/api';

// Linha do tempo do relato. A barra "cresce" até a etapa atual quando
// o agente muda o status na web — o movimento mostra o progresso.
export default function StatusTimeline({ status, events = [] }) {
  const reduced = useReducedMotion();
  const current = STATUS[status]?.step ?? 1;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const to = Math.max(0, (Math.min(current, 4) - 1) / (STEPS.length - 1));
    if (reduced) progress.setValue(to);
    else
      Animated.timing(progress, {
        toValue: to,
        duration: DURATION.slow,
        easing: EASE_OUT,
        useNativeDriver: false,
      }).start();
  }, [current, reduced]);

  const lastEventFor = (st) => [...events].reverse().find((e) => e.status === st);
  const refused = status === 'recusado';
  const steps = refused ? ['recebido', 'em_analise', 'recusado'] : STEPS;

  return (
    <View style={styles.wrap} accessibilityRole="list" accessibilityLabel="Andamento do relato">
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: refused ? STATUS.recusado.color : colors.primary,
              height: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      {steps.map((st) => {
        const s = STATUS[st];
        const done = refused ? true : s.step <= current;
        const ev = lastEventFor(st);
        return (
          <View
            key={st}
            style={styles.step}
            accessible
            accessibilityLabel={`${s.label}: ${done ? 'concluído' : 'ainda não'}${ev?.note ? '. ' + ev.note : ''}`}
          >
            <View style={[styles.dot, done ? { backgroundColor: s.color, borderColor: s.color } : null]}>
              <Ionicons name={done ? 'checkmark' : s.icon} size={16} color={done ? colors.white : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, !done && styles.muted]}>{s.label}</Text>
              {ev?.note ? <Text style={styles.note}>{ev.note}</Text> : null}
              {ev ? <Text style={styles.time}>{timeAgo(ev.created_at)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', paddingLeft: 0, gap: 18 },
  track: {
    position: 'absolute',
    left: 15,
    top: 16,
    bottom: 16,
    width: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { width: '100%' },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  dot: {
    width: 33,
    height: 33,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 5 },
  muted: { color: colors.textMuted, fontWeight: '500' },
  note: { fontSize: 15, color: colors.text, marginTop: 2 },
  time: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
