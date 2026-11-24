// Identidade visual do Zela — compartilhada com a web (web/src/styles/tokens.css)
// Todos os pares texto/fundo têm contraste >= 4.5:1 (WCAG AA).

export const colors = {
  primary: '#0B5D4B',      // verde Zela — 7.6:1 sobre branco
  primaryDark: '#073F33',
  primarySoft: '#E3F1EC',
  accent: '#FFC83D',       // amarelo "sinal" — usado só com texto escuro
  bg: '#F6F8F5',
  surface: '#FFFFFF',
  text: '#16201C',
  textMuted: '#46534D',    // 7.9:1 sobre branco
  border: '#C9D3CE',
  danger: '#B91C1C',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = (n) => n * 4;

// Tamanho mínimo de toque (acima dos 48dp recomendados)
export const TOUCH = 56;

export const CATEGORIES = {
  buraco:      { label: 'Buraco na rua',        icon: 'warning-outline' },
  iluminacao:  { label: 'Poste apagado',        icon: 'bulb-outline' },
  lixo:        { label: 'Lixo ou entulho',      icon: 'trash-outline' },
  calcada:     { label: 'Calçada quebrada',     icon: 'walk-outline' },
  arvore:      { label: 'Árvore com risco',     icon: 'leaf-outline' },
  alagamento:  { label: 'Alagamento',           icon: 'water-outline' },
  sinalizacao: { label: 'Placa ou sinalização', icon: 'trail-sign-outline' },
  mato:        { label: 'Mato alto na praça',   icon: 'flower-outline' },
  ponto:       { label: 'Ponto de ônibus',      icon: 'bus-outline' },
  outro:       { label: 'Outro problema',       icon: 'ellipsis-horizontal-circle-outline' },
};

// Status nunca dependem só da cor: sempre ícone + texto
export const STATUS = {
  pendente:     { label: 'Aguardando internet', icon: 'cloud-offline-outline', color: '#46534D', step: 0 },
  recebido:     { label: 'Recebido',     icon: 'mail-open-outline',        color: '#1D4ED8', step: 1 },
  em_analise:   { label: 'Em análise',   icon: 'search-outline',           color: '#6D28D9', step: 2 },
  em_andamento: { label: 'Em andamento', icon: 'construct-outline',        color: '#A14A06', step: 3 },
  resolvido:    { label: 'Resolvido',    icon: 'checkmark-circle-outline', color: '#15803D', step: 4 },
  recusado:     { label: 'Não atendido', icon: 'close-circle-outline',     color: '#B91C1C', step: 4 },
};

export const STEPS = ['recebido', 'em_analise', 'em_andamento', 'resolvido'];
