import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createReport, discardPhoto, getDeviceId, isNetworkError, keepPhoto } from './api';
import { supabase } from './supabase';
import { STATUS } from './theme';

const QUEUE_KEY = 'zela:fila-offline';
const AppContext = createContext(null);

// Fila offline: o cidadão está na rua, com sinal ruim. O relato é salvo no
// aparelho e enviado sozinho assim que a internet volta.
export function AppProvider({ children }) {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState([]);
  const [toast, setToast] = useState(null);
  const [lastSync, setLastSync] = useState(0);
  const flushing = useRef(false);

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone, key: Date.now() });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const persist = async (list) => {
    setQueue(list);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  };

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      let list = raw ? JSON.parse(raw) : [];
      let sent = 0;
      let failed = 0;
      for (const draft of [...list]) {
        try {
          await createReport(draft);
          list = list.filter((d) => d.localId !== draft.localId);
          await persist(list);
          discardPhoto(draft.photoUri);
          sent++;
        } catch (e) {
          if (isNetworkError(e)) break; // ainda sem conexão: tenta de novo depois
          // Erro que não é de rede: este relato fica marcado, mas não trava os outros
          failed++;
          list = list.map((d) => (d.localId === draft.localId ? { ...d, attempts: (d.attempts || 0) + 1 } : d));
          await persist(list);
        }
      }
      if (failed > 0) {
        showToast('Um relato guardado não pôde ser enviado. Tentaremos de novo mais tarde.', 'warn');
      }
      if (sent > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(sent === 1 ? 'Relato guardado foi enviado.' : `${sent} relatos guardados foram enviados.`, 'success');
        setLastSync(Date.now());
      }
    } finally {
      flushing.current = false;
    }
  }, [showToast]);

  useEffect(() => {
    AsyncStorage.getItem(QUEUE_KEY).then((raw) => setQueue(raw ? JSON.parse(raw) : []));
    const unsub = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(isOnline);
      if (isOnline) flush();
    });
    return unsub;
  }, [flush]);

  // Integração em tempo real: quando o agente muda o status no painel web,
  // o cidadão recebe o aviso aqui na hora, em qualquer tela.
  useEffect(() => {
    let channel;
    getDeviceId().then((deviceId) => {
      channel = supabase
        .channel('meus-relatos')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'reports', filter: `device_id=eq.${deviceId}` },
          (payload) => {
            const { new: n, old: o } = payload;
            if (o?.status && n.status === o.status) return;
            const label = STATUS[n.status]?.label || n.status;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(`Seu relato ${n.protocol} agora está: ${label}.`, 'success');
            setLastSync(Date.now());
          }
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [showToast]);

  const enqueue = useCallback(async (draft) => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const { photoBase64, ...rest } = draft; // a foto vai como arquivo, não como texto
    const item = { ...rest, photoUri: await keepPhoto(draft.photoUri), localId: 'local-' + Date.now(), status: 'pendente' };
    await persist([item, ...list]);
    return item;
  }, []);

  return (
    <AppContext.Provider value={{ online, queue, enqueue, flush, toast, showToast, setToast, lastSync }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
