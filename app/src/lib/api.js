import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { File, Paths } from 'expo-file-system';
import { supabase } from './supabase';

const DEVICE_KEY = 'zela:device-id';

// Identificador anônimo do aparelho: o cidadão não precisa criar conta
// para relatar e acompanhar os próprios relatos.
let cachedDeviceId = null;
export async function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  cachedDeviceId = id;
  return id;
}

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

// Erro de rede (sem sinal, tempo esgotado) → vale guardar e tentar depois.
// Outros erros (dados inválidos, permissão) não se resolvem tentando de novo.
export function isNetworkError(e) {
  if (!e) return false;
  if (e.message === 'offline') return true;
  const msg = String(e.message || e);
  if (/network|fetch|timeout|timed out|abort|failed to connect/i.test(msg)) return true;
  // Erros do Postgres/Storage vêm com código ou status HTTP
  return !e.code && !e.status && !e.statusCode;
}

// ~2 km em volta da pessoa. Sem localização, mostra os mais recentes.
const NEAR_DEG = 0.02;

export async function fetchNearby(position) {
  let q = supabase
    .from('reports')
    .select('*')
    .not('status', 'in', '(resolvido,recusado)');
  if (position) {
    q = q
      .gte('lat', position.lat - NEAR_DEG).lte('lat', position.lat + NEAR_DEG)
      .gte('lng', position.lng - NEAR_DEG).lte('lng', position.lng + NEAR_DEG);
  }
  const { data, error } = await q.order('created_at', { ascending: false }).limit(60);
  if (error) throw error;
  const list = data.map((r) => ({
    ...r,
    distance: position ? distanceKm(position, { lat: r.lat, lng: r.lng }) : null,
  }));
  if (position) list.sort((a, b) => a.distance - b.distance);
  return list;
}

export async function fetchMine() {
  const deviceId = await getDeviceId();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchReport(id) {
  const [{ data: report, error }, { data: events, error: e2 }] = await Promise.all([
    supabase.from('reports').select('*').eq('id', id).single(),
    supabase.from('report_events').select('*').eq('report_id', id).order('created_at'),
  ]);
  if (error) throw error;
  if (e2) throw e2;
  return { report, events };
}

export async function fetchMySupports() {
  const deviceId = await getDeviceId();
  const { data } = await supabase.from('supports').select('report_id').eq('device_id', deviceId);
  return new Set((data || []).map((s) => s.report_id));
}

// A foto fica como arquivo no aparelho e só é lida na hora do envio.
// Guardar o base64 no AsyncStorage estoura o limite do Android com poucos relatos.
async function uploadPhoto(draft) {
  const base64 = draft.photoBase64 || (await readPhotoBase64(draft.photoUri));
  const deviceId = await getDeviceId();
  const path = `${deviceId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, decode(base64), { contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl;
}

// Copia a foto para a pasta do app: o cache da câmera pode ser limpo pelo
// sistema antes de a internet voltar.
export async function keepPhoto(uri) {
  if (!uri) return null;
  try {
    const dest = new File(Paths.document, `fila-${Date.now()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

export function discardPhoto(uri) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists && uri.startsWith(Paths.document.uri)) f.delete();
  } catch {
    // arquivo já não existe
  }
}

async function readPhotoBase64(uri) {
  return new File(uri).base64();
}

export async function createReport(draft) {
  const deviceId = await getDeviceId();
  const photo_url = draft.photoBase64 || draft.photoUri ? await uploadPhoto(draft) : null;
  const { data, error } = await supabase
    .from('reports')
    .insert({
      category: draft.category,
      description: draft.description?.trim() || null,
      lat: draft.lat,
      lng: draft.lng,
      address: draft.address || null,
      photo_url,
      device_id: deviceId,
      created_at: draft.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function supportReport(reportId) {
  const deviceId = await getDeviceId();
  const { error } = await supabase.from('supports').insert({ report_id: reportId, device_id: deviceId });
  if (error && error.code !== '23505') throw error; // 23505 = já apoiou
  return true;
}
