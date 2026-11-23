import { icon } from './icons.js';
import { STATUS, CATEGORIES, esc } from './data.js';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Anuncia mudanças para leitores de tela
export function announce(msg) {
  const el = document.getElementById('anuncio');
  el.textContent = '';
  setTimeout(() => (el.textContent = msg), 50);
}

// Toast: retorno visual de ações (status salvo, novo relato chegou)
export function toast(message, tone = 'info') {
  const box = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast toast-${tone}`;
  t.innerHTML = `${icon(tone === 'success' ? 'check' : tone === 'new' ? 'flame' : 'alert')}<span>${esc(message)}</span>`;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('toast-out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
    if (reducedMotion()) t.remove();
  }, 4000);
}

export function statusBadge(status) {
  const s = STATUS[status] || STATUS.recebido;
  return `<span class="badge" style="--c:${s.color}">${icon(s.icon, 16)}${s.label}</span>`;
}

export function categoryLabel(cat) {
  const c = CATEGORIES[cat] || CATEGORIES.outro;
  return `<span class="cat">${icon(c.icon, 18)}${c.label}</span>`;
}

// Troca de tela com View Transitions quando disponível (fallback: troca direta)
export function swapView(render) {
  if (document.startViewTransition && !reducedMotion()) document.startViewTransition(render);
  else render();
}

// Animação FLIP: o card "viaja" até a nova posição quando a fila é reordenada
export function flip(container, mutate) {
  if (reducedMotion()) return mutate();
  const first = new Map([...container.children].map((el) => [el.dataset.id, el.getBoundingClientRect().top]));
  mutate();
  [...container.children].forEach((el) => {
    const top = first.get(el.dataset.id);
    if (top == null) return;
    const dy = top - el.getBoundingClientRect().top;
    if (!dy) return;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
      duration: 320,
      easing: 'cubic-bezier(.2,.8,.2,1)',
    });
  });
}
