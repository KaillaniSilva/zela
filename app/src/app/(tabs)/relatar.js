import { useEffect, useRef, useState } from 'react';
import {
  Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import ZButton from '../../components/ZButton';
import OfflineBanner from '../../components/OfflineBanner';
import { CATEGORIES, colors, radius, space, TOUCH } from '../../lib/theme';
import { createReport, fetchNearby, supportReport, formatDistance, isNetworkError } from '../../lib/api';
import { useLocation } from '../../lib/useLocation';
import { useApp } from '../../lib/AppContext';
import { DURATION, EASE_OUT, useReducedMotion } from '../../lib/motion';

const STEP_TITLES = ['O que você viu?', 'Foto e local', 'Confirme e envie'];

export default function Relatar() {
  const { position, address, status: locStatus, refresh } = useLocation();
  const { online, enqueue, showToast } = useApp();
  const reduced = useReducedMotion();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [duplicate, setDuplicate] = useState(null);

  // Barra de progresso animada: mostra em que etapa a pessoa está
  const progress = useRef(new Animated.Value(1 / 3)).current;
  // Transição entre etapas: a nova etapa entra deslizando da direita
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const to = (step + 1) / 3;
    if (reduced) {
      progress.setValue(to);
      slide.setValue(1);
      return;
    }
    Animated.timing(progress, { toValue: to, duration: DURATION.base, easing: EASE_OUT, useNativeDriver: false }).start();
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: DURATION.base, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [step, reduced]);

  // Antes de enviar, procura relato igual a menos de 80 m (evita duplicados)
  useEffect(() => {
    if (step !== 2 || !position || !online) return;
    fetchNearby(position)
      .then((list) => setDuplicate(list.find((r) => r.category === category && r.distance < 0.08) || null))
      .catch(() => setDuplicate(null));
  }, [step]);

  const reset = () => {
    setStep(0); setCategory(null); setPhoto(null); setDescription(''); setDone(null); setDuplicate(null);
  };

  const pickPhoto = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast('Sem permissão para acessar a câmera ou as fotos.', 'warn');
      return;
    }
    // Sem base64 aqui: a foto é lida do arquivo só na hora do envio
    const opts = { mediaTypes: ['images'], quality: 0.4, base64: false, exif: false };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0]);
  };

  const submit = async () => {
    if (!position) {
      showToast('Precisamos do local. Toque em "Usar minha localização".', 'warn');
      return;
    }
    setSending(true);
    const draft = {
      category,
      description,
      lat: position.lat,
      lng: position.lng,
      address,
      photoUri: photo?.uri || null,
      createdAt: new Date().toISOString(),
    };
    try {
      if (!online) throw new Error('offline');
      const saved = await createReport(draft);
      setDone({ ...saved, offline: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      if (isNetworkError(e)) {
        const item = await enqueue(draft);
        setDone({ ...item, offline: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Não é falta de internet: guardar não resolveria. A pessoa tenta de novo.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('Não foi possível enviar o relato. Tente de novo em instantes.', 'warn');
      }
    } finally {
      setSending(false);
    }
  };

  const supportDuplicate = async () => {
    try {
      await supportReport(duplicate.id);
    } catch {
      showToast('Sem conexão para registrar o apoio. Tente de novo ou envie seu relato.', 'warn');
      return;
    }
    showToast('Você apoiou o relato que já existia. Obrigado!', 'success');
    const id = duplicate.id;
    reset();
    router.push(`/relato/${id}`);
  };

  if (done) return <Success done={done} onNew={reset} />;

  const stepStyle = {
    opacity: slide,
    transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <Text style={styles.stepCount} accessibilityLiveRegion="polite">
            Etapa {step + 1} de 3
          </Text>
          <Text style={styles.h1} accessibilityRole="header">
            {STEP_TITLES[step]}
          </Text>
          <View
            style={styles.bar}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: 3, now: step + 1 }}
          >
            <Animated.View
              style={[styles.barFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <OfflineBanner />
          <Animated.View style={[stepStyle, { gap: space(4) }]}>
            {step === 0 && (
              <View style={styles.grid}>
                {Object.entries(CATEGORIES).map(([key, c]) => {
                  const selected = category === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={c.label}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(key);
                        setTimeout(() => setStep(1), reduced ? 0 : 180);
                      }}
                      style={({ pressed }) => [styles.tile, selected && styles.tileOn, pressed && styles.tilePressed]}
                    >
                      <Ionicons name={c.icon} size={34} color={selected ? colors.white : colors.primary} />
                      <Text style={[styles.tileText, selected && { color: colors.white }]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {step === 1 && (
              <>
                <Text style={styles.label}>Foto (ajuda a equipe a entender o problema)</Text>
                {photo ? (
                  <View style={{ gap: space(2) }}>
                    <Image source={{ uri: photo.uri }} style={styles.preview} accessibilityLabel="Foto escolhida do problema" />
                    <ZButton label="Trocar foto" icon="refresh" variant="secondary" onPress={() => pickPhoto(true)} />
                  </View>
                ) : (
                  <View style={{ gap: space(3) }}>
                    <ZButton label="Tirar foto" icon="camera" onPress={() => pickPhoto(true)} />
                    <ZButton label="Escolher da galeria" icon="images-outline" variant="secondary" onPress={() => pickPhoto(false)} />
                  </View>
                )}

                <Text style={[styles.label, { marginTop: space(2) }]}>Local</Text>
                <View style={styles.locCard} accessible accessibilityLabel={locText(locStatus, address, position)}>
                  <Ionicons name="location" size={24} color={colors.primary} />
                  <Text style={styles.locText}>{locText(locStatus, address, position)}</Text>
                </View>
                <ZButton label="Usar minha localização" icon="locate" variant="ghost" onPress={refresh} />
              </>
            )}

            {step === 2 && (
              <>
                {duplicate && (
                  <View style={styles.dup} accessibilityRole="alert">
                    <Text style={styles.dupTitle}>Já tem um relato igual a {formatDistance(duplicate.distance)} daqui</Text>
                    <Text style={styles.dupText}>
                      Apoiar o relato existente faz ele subir na fila da prefeitura, sem criar repetidos.
                    </Text>
                    <ZButton label="Apoiar o relato existente" icon="hand-left-outline" onPress={supportDuplicate} />
                  </View>
                )}

                <Text nativeID="descLabel" style={styles.label}>
                  Quer contar mais? (opcional)
                </Text>
                <TextInput
                  accessibilityLabelledBy="descLabel"
                  accessibilityLabel="Descrição do problema, opcional"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  placeholder="Ex.: o buraco fica em frente ao número 120"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
                <Text style={styles.meta}>{description.length}/500</Text>

                <View style={styles.summary}>
                  <Row icon={CATEGORIES[category]?.icon} text={CATEGORIES[category]?.label} />
                  <Row icon="image-outline" text={photo ? 'Com foto' : 'Sem foto'} />
                  <Row icon="location-outline" text={locText(locStatus, address, position)} />
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>

        {step > 0 && <View style={styles.footer}>
          {(
            <ZButton label="Voltar" icon="arrow-back" variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />
          )}
          {step === 1 && (
            <ZButton label="Continuar" icon="arrow-forward" onPress={() => setStep(2)} disabled={!position} style={{ flex: 2 }} />
          )}
          {step === 2 && (
            <ZButton
              label={online ? 'Enviar relato' : 'Guardar e enviar depois'}
              icon="send"
              onPress={submit}
              loading={sending}
              style={{ flex: 2 }}
            />
          )}
        </View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function locText(status, address, position) {
  if (status === 'negado') return 'Permissão de localização negada. Ative nas configurações.';
  if (!position) return 'Buscando sua localização…';
  return address || `Lat ${position.lat.toFixed(5)}, Lng ${position.lng.toFixed(5)}`;
}

function Row({ icon, text }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon || 'ellipse-outline'} size={20} color={colors.primary} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

// Tela de sucesso: o check "salta" para confirmar que deu certo
function Success({ done, onNew }) {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (!reduced) Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, []);
  return (
    <SafeAreaView style={[styles.safe, styles.success]}>
      <Animated.View style={[styles.check, { transform: [{ scale: pop }] }]}>
        <Ionicons name={done.offline ? 'cloud-upload-outline' : 'checkmark'} size={64} color={colors.white} />
      </Animated.View>
      <Text style={[styles.h1, { textAlign: 'center' }]} accessibilityRole="header" accessibilityLiveRegion="polite">
        {done.offline ? 'Relato guardado no celular' : 'Relato enviado!'}
      </Text>
      <Text style={[styles.lead, { textAlign: 'center' }]}>
        {done.offline
          ? 'Assim que a internet voltar, ele é enviado sozinho. Você não precisa fazer nada.'
          : `Protocolo ${done.protocol}. A equipe da subprefeitura já pode ver. Avisaremos cada mudança.`}
      </Text>
      <View style={{ gap: space(3), alignSelf: 'stretch' }}>
        {!done.offline && (
          <ZButton label="Acompanhar andamento" icon="eye-outline" onPress={() => { onNew(); router.push(`/relato/${done.id}`); }} />
        )}
        <ZButton label="Relatar outro problema" icon="add" variant="secondary" onPress={onNew} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: space(5), paddingTop: space(4), gap: space(2) },
  stepCount: { fontSize: 15, fontWeight: '700', color: colors.primary },
  h1: { fontSize: 28, fontWeight: '800', color: colors.text },
  lead: { fontSize: 17, color: colors.textMuted, lineHeight: 24 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginTop: space(1) },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  body: { padding: space(5), gap: space(4), paddingBottom: space(8) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
  tile: {
    width: '47.5%', minHeight: 112, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8,
  },
  tileOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tilePressed: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tileText: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  label: { fontSize: 17, fontWeight: '700', color: colors.text },
  preview: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.border },
  locCard: {
    flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, minHeight: TOUCH,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  locText: { flex: 1, fontSize: 16, color: colors.text },
  input: {
    minHeight: 120, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 14,
    fontSize: 17, color: colors.text, backgroundColor: colors.surface, textAlignVertical: 'top',
  },
  meta: { fontSize: 14, color: colors.textMuted, alignSelf: 'flex-end' },
  summary: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, gap: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rowText: { fontSize: 16, color: colors.text, flex: 1 },
  dup: { backgroundColor: '#FFF6DB', borderColor: colors.accent, borderWidth: 2, borderRadius: radius.md, padding: 14, gap: 8 },
  dupTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  dupText: { fontSize: 15, color: colors.text },
  footer: {
    flexDirection: 'row', gap: space(3), padding: space(4), borderTopWidth: 1,
    borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  success: { alignItems: 'center', justifyContent: 'center', padding: space(6), gap: space(5) },
  check: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
