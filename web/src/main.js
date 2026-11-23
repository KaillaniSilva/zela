import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/main.css';
import { swapView } from './ui.js';
import { isConfigured } from './supabase.js';
import * as publico from './views/publico.js';
import * as protocolo from './views/protocolo.js';
import * as painel from './views/painel.js';

const routes = {
  '/': { view: publico, title: 'Mapa do bairro' },
  '/protocolo': { view: protocolo, title: 'Consultar protocolo' },
  '/painel': { view: painel, title: 'Painel da subprefeitura' },
};

const main = document.getElementById('conteudo');
let cleanup = null;

function currentPath() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query] = hash.split('?');
  return { path, params: new URLSearchParams(query || '') };
}

async function render() {
  const { path, params } = currentPath();
  const route = routes[path] || routes['/'];

  document.querySelectorAll('[data-route]').forEach((a) => {
    if (a.dataset.route === path) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  closeMenu();

  swapView(async () => {
    cleanup?.();
    main.innerHTML = '';
    if (!isConfigured) {
      main.insertAdjacentHTML(
        'beforeend',
        `<div class="container"><p class="alert" role="alert">Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>web/.env</code> (veja o README).</p></div>`
      );
    }
    cleanup = await route.view.mount(main, params);
    document.title = `${route.title} · Zela`;
    // Leva o foco para o título da nova página (leitores de tela e teclado)
    const h1 = main.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
  });
}

// Menu mobile
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  menu.classList.remove('open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('open', open);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('open')) {
    closeMenu();
    toggle.focus();
  }
});

window.addEventListener('hashchange', render);
render();
