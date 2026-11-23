import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import StatusTimeline from '../../components/StatusTimeline';
import ZButton from '../../components/ZButton';
import { CATEGORIES, colors, radius, space } from '../../lib/theme';
import { fetchMySupports, fetchReport, getDeviceId, supportReport, timeAgo } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../lib/AppContext';
import { useEntrance, usePulse } from '../../lib/motion';

export default function Detalhe() {
  const { id } = useLocalSearchParams();
  const { showToast } = useApp();
  const [data, setData] = useState(null);
  const [supported, setSupported] = useState(false);
  const [mineId, setMineId] = useState(null);
  const enter = useEntrance(0);
  const pulse = usePulse(data?.report?.status);

  const load = useCallback(async () => {
    try {
      const [d, sup, dev] = await Promise.all([fetchReport(id), fetchMySupports(), getDeviceId()]);
      setData(d);
      setSupported(sup.has(id));
      setMineId(dev);
    } catch {
      showToast('Não foi possível carregar este relato.', 'warn');
    }
  }, [id]);

  useEffect(() => {
    load();
    // Tempo real: novos eventos do agente aparecem na linha do tempo sem recarregar
    const ch = supabase
      .channel(`relato-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_events', filter: `report_id=eq.${id}` }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Carregando relato" />
      </View>
    );
  }

  const { report, events } = data;
  const cat = CATEGORIES[report.category] || CATEGORIES.outro;
  const isMine = report.device_id === mineId;

  const support = async () => {
    setSupported(true);
    try {
      await supportReport(report.id);
      showToast('Apoio registrado. Obrigado!', 'success');
      load();
    } catch {
      setSupported(false);
      showToast('Sem conexão para registrar o apoio.', 'warn');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={[{ gap: space(3) }]}>
        {report.photo_url ? (
          <Image source={{ uri: report.photo_url }} style={styles.photo} accessibilityLabel={`Foto do problema: ${cat.label}`} />
        ) : null}
        <View style={styles.titleRow}>
          <Ionicons name={cat.icon} size={28} color={colors.primary} />
          <Text style={styles.h1} accessibilityRole="header">{cat.label}</Text>
        </View>
        <Animated.View style={pulse}>
          <StatusBadge status={report.status} />
        </Animated.View>
        <Text style={styles.meta}>
          Protocolo {report.protocol} · enviado {timeAgo(report.created_at)}
          {isMine ? ' · por você' : ''}
        </Text>
        {report.address ? <Text style={styles.text}><Ionicons name="location-outline" size={16} /> {report.address}</Text> : null}
        {report.description ? <Text style={styles.text}>“{report.description}”</Text> : null}
      </View>

      <Animated.View style={[styles.card, enter]}>
        <Text style={styles.h2} accessibilityRole="header">Andamento</Text>
        <StatusTimeline status={report.status} events={events} />
      </Animated.View>

      <View style={styles.card}>
        <Text style={styles.h2} accessibilityRole="header">
          {report.supports_count} {report.supports_count === 1 ? 'vizinho também viu' : 'vizinhos também viram'}
        </Text>
        <Text style={styles.meta}>Quanto mais apoios, mais alto o problema fica na fila da subprefeitura.</Text>
        {!isMine && (
          <ZButton
            label={supported ? 'Você já apoiou' : 'Eu também vi isso'}
            icon={supported ? 'checkmark' : 'hand-left-outline'}
            variant={supported ? 'ghost' : 'primary'}
            disabled={supported}
            onPress={support}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: space(5), gap: space(5), paddingBottom: space(10) },
  photo: { width: '100%', height: 240, borderRadius: radius.md, backgroundColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.text, flex: 1 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 15, color: colors.textMuted },
  text: { fontSize: 17, color: colors.text, lineHeight: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: space(4), gap: space(4),
    borderWidth: 1, borderColor: colors.border,
  },
});
