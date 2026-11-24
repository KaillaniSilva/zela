import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, colors, radius, TOUCH } from '../lib/theme';
import { formatDistance, timeAgo } from '../lib/api';
import { useEntrance, usePulse } from '../lib/motion';
import StatusBadge from './StatusBadge';
import ZButton from './ZButton';

export default function ReportCard({ report, index = 0, onPress, onSupport, supported, mine }) {
  const enter = useEntrance(index);
  const pulse = usePulse(report.status);
  const cat = CATEGORIES[report.category] || CATEGORIES.outro;

  const a11y = [
    cat.label,
    report.address,
    report.distance != null ? `a ${formatDistance(report.distance)}` : null,
    `enviado ${timeAgo(report.created_at)}`,
    report.supports_count ? `${report.supports_count} apoios` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    // O botão "Eu também vi" fica fora da área tocável do card: assim o
    // leitor de tela (TalkBack/VoiceOver) chega nele como um botão separado.
    <Animated.View style={[styles.card, { opacity: enter.opacity, transform: [...enter.transform, ...pulse.transform] }]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={a11y}
        accessibilityHint={onPress ? 'Abre os detalhes e o andamento' : undefined}
        style={({ pressed }) => [styles.press, pressed && { backgroundColor: colors.primarySoft }]}
      >
        <View style={styles.row}>
          {report.photo_url || report.photoUri ? (
            <Image
              source={{ uri: report.photo_url || report.photoUri }}
              style={styles.thumb}
              accessibilityIgnoresInvertColors
              accessible={false}
            />
          ) : (
            <View style={[styles.thumb, styles.iconThumb]}>
              <Ionicons name={cat.icon} size={30} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{cat.label}</Text>
            {report.address ? (
              <Text style={styles.meta} numberOfLines={1}>
                {report.address}
              </Text>
            ) : null}
            <Text style={styles.meta}>
              {report.distance != null ? `${formatDistance(report.distance)} · ` : ''}
              {timeAgo(report.created_at || report.createdAt)}
              {report.protocol ? ` · ${report.protocol}` : ''}
            </Text>
            <StatusBadge status={report.status} />
          </View>
        </View>
      </Pressable>
      {onSupport ? (
        <View style={styles.footer}>
          <Text style={styles.meta}>
            <Ionicons name="people-outline" size={14} /> {report.supports_count || 0} vizinhos também viram
          </Text>
          {mine ? (
            <Text style={styles.meta}>Relatado por você</Text>
          ) : (
            <ZButton
              label={supported ? 'Você apoiou' : 'Eu também vi'}
              icon={supported ? 'checkmark' : 'hand-left-outline'}
              variant={supported ? 'ghost' : 'secondary'}
              disabled={supported}
              onPress={onSupport}
              accessibilityHint="Aumenta a prioridade deste problema para a prefeitura"
            />
          )}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  press: { padding: 14, minHeight: TOUCH },
  row: { flexDirection: 'row', gap: 14 },
  thumb: { width: 76, height: 76, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  iconThumb: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexWrap: 'wrap',
  },
});
