import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ZButton from '../../components/ZButton';
import ReportCard from '../../components/ReportCard';
import OfflineBanner from '../../components/OfflineBanner';
import { colors, space } from '../../lib/theme';
import { fetchMySupports, fetchNearby, getDeviceId, supportReport } from '../../lib/api';
import { useLocation } from '../../lib/useLocation';
import { useApp } from '../../lib/AppContext';
import { isConfigured } from '../../lib/supabase';
import { useEntrance } from '../../lib/motion';

export default function Home() {
  const { position, status: locStatus } = useLocation();
  const { online, showToast, lastSync } = useApp();
  const [reports, setReports] = useState([]);
  const [supported, setSupported] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const heroAnim = useEntrance(0);

  const load = useCallback(async () => {
    if (!isConfigured || !online) return;
    setLoading(true);
    try {
      const [list, mine, dev] = await Promise.all([fetchNearby(position), fetchMySupports(), getDeviceId()]);
      setReports(list.slice(0, 20));
      setSupported(mine);
      setDeviceId(dev);
    } catch {
      showToast('Não foi possível carregar os relatos agora.', 'warn');
    } finally {
      setLoading(false);
    }
  }, [position, online]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [lastSync]);

  const onSupport = async (r) => {
    setSupported((s) => new Set(s).add(r.id));
    setReports((list) => list.map((x) => (x.id === r.id ? { ...x, supports_count: x.supports_count + 1 } : x)));
    try {
      await supportReport(r.id);
      showToast('Apoio registrado. Isso aumenta a prioridade do problema.', 'success');
    } catch {
      // desfaz a atualização otimista
      setSupported((s) => {
        const n = new Set(s);
        n.delete(r.id);
        return n;
      });
      setReports((list) => list.map((x) => (x.id === r.id ? { ...x, supports_count: x.supports_count - 1 } : x)));
      showToast('Sem conexão para registrar o apoio.', 'warn');
    }
  };

  const header = (
    <View style={{ gap: space(4), marginBottom: space(2) }}>
      <View style={styles.brandRow}>
        <View style={styles.logo} accessible={false}>
          <Ionicons name="location" size={22} color={colors.white} />
        </View>
        <Text style={styles.brand} accessibilityRole="header">
          Zela
        </Text>
      </View>

      {!isConfigured && (
        <View style={styles.warn} accessibilityRole="alert">
          <Text style={styles.warnText}>
            Configure o Supabase em app/.env (veja o README) para ver e enviar relatos.
          </Text>
        </View>
      )}

      <OfflineBanner />

      <View style={[styles.hero]}>
        <View style={heroAnim}>
          <Text style={styles.h1} accessibilityRole="header">
            Viu um problema na rua?
          </Text>
          <Text style={styles.lead}>Leva menos de 30 segundos. A prefeitura recebe na hora e você acompanha por aqui.</Text>
        </View>
        <ZButton
          size="lg"
          variant="accent"
          icon="camera-outline"
          label="Relatar um problema"
          accessibilityHint="Abre o passo a passo: tipo, foto e local"
          onPress={() => router.navigate('/relatar')}
        />
      </View>

      <Text style={styles.h2} accessibilityRole="header">
        Perto de você
      </Text>
      {locStatus === 'negado' && (
        <Text style={styles.meta}>Sem acesso à localização: mostrando os relatos mais recentes.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space(3) }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        renderItem={({ item, index }) => (
          <ReportCard
            report={item}
            index={index}
            supported={supported.has(item.id)}
            mine={item.device_id === deviceId}
            onSupport={() => onSupport(item)}
            onPress={() => router.push(`/relato/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading && isConfigured ? (
            <Text style={styles.meta}>Nenhum problema aberto por perto. Bom sinal!</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space(5), paddingBottom: space(10) },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontSize: 26, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  hero: { backgroundColor: colors.primary, borderRadius: 24, padding: space(5), gap: space(4) },
  h1: { fontSize: 28, fontWeight: '800', color: colors.white, lineHeight: 34 },
  lead: { fontSize: 17, color: '#E3F1EC', marginTop: 6, lineHeight: 24 },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: space(2) },
  meta: { fontSize: 15, color: colors.textMuted },
  warn: { backgroundColor: '#FDE8E8', borderRadius: 12, padding: 12 },
  warnText: { color: '#7F1D1D', fontSize: 15, fontWeight: '600' },
});
