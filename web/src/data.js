// Espelha app/src/lib/theme.js — mesmas categorias, status e cores.

export const CATEGORIES = {
  buraco: { label: 'Buraco na rua', icon: 'alert', weight: 2 },
  iluminacao: { label: 'Poste apagado', icon: 'bulb', weight: 2 },
  lixo: { label: 'Lixo ou entulho', icon: 'trash', weight: 1 },
  calcada: { label: 'Calçada quebrada', icon: 'walk', weight: 2 },
  arvore: { label: 'Árvore com risco', icon: 'leaf', weight: 3 },
  alagamento: { label: 'Alagamento', icon: 'drop', weight: 3 },
  sinalizacao: { label: 'Placa ou sinalização', icon: 'sign', weight: 2 },
  outro: { label: 'Outro problema', icon: 'dots', weight: 1 },
};

// Cada status tem cor + ícone + forma do marcador no mapa (não depende só de cor)
export const STATUS = {
  recebido: { label: 'Recebido', icon: 'inbox', color: '#1D4ED8', shape: 'circle' },
  em_analise: { label: 'Em análise', icon: 'search', color: '#6D28D9', shape: 'diamond' },
  em_andamento: { label: 'Em andamento', icon: 'tool', color: '#A14A06', shape: 'square' },
  resolvido: { label: 'Resolvido', icon: 'check', color: '#15803D', shape: 'check' },
  recusado: { label: 'Não atendido', icon: 'x', color: '#B91C1C', shape: 'x' },
};

export const FLOW = ['recebido', 'em_analise', 'em_andamento', 'resolvido'];

export function daysOpen(r) {
  return Math.max(0, (Date.now() - new Date(r.created_at).getTime()) / 86400000);
}

// Prioridade = apoios dos vizinhos + tempo aberto + risco da categoria
export function priority(r) {
  if (r.status === 'resolvido' || r.status === 'recusado') return { score: -1, level: 'fechado', label: 'Encerrado' };
  const score = r.supports_count * 3 + Math.min(daysOpen(r), 15) + (CATEGORIES[r.category]?.weight || 1) * 3;
  if (score >= 20) return { score, level: 'alta', label: 'Prioridade alta' };
  if (score >= 10) return { score, level: 'media', label: 'Prioridade média' };
  return { score, level: 'baixa', label: 'Prioridade baixa' };
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
