import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/AppContext';
import { colors } from '../lib/theme';

export default function OfflineBanner() {
  const { online, queue } = useApp();
  if (online && queue.length === 0) return null;
  const msg = !online
    ? 'Sem internet. Você pode relatar mesmo assim: o envio acontece quando o sinal voltar.'
    : `Enviando ${queue.length} relato(s) guardado(s)…`;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name={online ? 'cloud-upload-outline' : 'cloud-offline-outline'} size={22} color={colors.text} />
      <Text style={styles.text}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 12,
  },
  text: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
});
