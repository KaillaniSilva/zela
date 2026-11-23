import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ReportCard from '../../components/ReportCard';
import OfflineBanner from '../../components/OfflineBanner';
import ZButton from '../../components/ZButton';
import { colors, space } from '../../lib/theme';
import { fetchMine } from '../../lib/api';
import { useApp } from '../../lib/AppContext';
import { isConfigured } from '../../lib/supabase';

export default function Meus() {
  const { queue, online, lastSync } = useApp();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured || !online) return;
    setLoading(true);
    try {
      setMine(await fetchMine());
    } catch {
      // mantém a lista anterior
    } finally {
      setLoading(false);
    }
  }, [online]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [lastSync]); // recarrega quando chega mudança em tempo real

  const resolved = mine.filter((r) => r.status === 'resolvido').length;
  const data = [...queue.map((q) => ({ ...q, id: q.localId })), ...mine];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space(3) }} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: space(4), marginBottom: space(2) }}>
            <Text style={styles.h1} accessibilityRole="header">
              Meus relatos
            </Text>
            <OfflineBanner />
            {mine.length > 0 && (
              <View style={styles.stats} accessible accessibilityLabel={`${mine.length} relatos enviados, ${resolved} resolvidos`}>
                <Stat n={mine.length} label="enviados" icon="send-outline" />
                <Stat n={resolved} label="resolvidos" icon="checkmark-circle-outline" />
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <ReportCard
            report={item}
            index={index}
            onPress={item.localId ? undefined : () => router.push(`/relato/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyText}>Você ainda não relatou nada. Quando relatar, o andamento aparece aqui.</Text>
              <ZButton label="Relatar um problema" icon="add" onPress={() => router.navigate('/relatar')} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function Stat({ n, label, icon }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space(5), paddingBottom: space(10) },
  h1: { fontSize: 28, fontWeight: '800', color: colors.text },
  stats: { flexDirection: 'row', gap: space(3) },
  stat: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14,
    backgroundColor: colors.primarySoft, borderRadius: 16,
  },
  statN: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statL: { fontSize: 15, color: colors.text },
  empty: { alignItems: 'center', gap: space(4), paddingVertical: space(10) },
  emptyText: { fontSize: 17, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
});
