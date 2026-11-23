import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS } from '../lib/theme';

// Status = ícone + texto + cor. Nunca só a cor.
export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.recebido;
  return (
    <View
      style={[styles.badge, { borderColor: s.color }]}
      accessible
      accessibilityLabel={`Situação: ${s.label}`}
    >
      <Ionicons name={s.icon} size={16} color={s.color} />
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  text: { fontSize: 14, fontWeight: '700' },
});
