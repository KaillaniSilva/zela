import L from 'leaflet';
import { supabase, isConfigured } from '../supabase.js';
import { CATEGORIES, STATUS, esc, timeAgo, daysOpen } from '../data.js';
import { icon } from '../icons.js';
import { announce, categoryLabel, reducedMotion, statusBadge, toast } from '../ui.js';

// Página pública: qualquer morador (inclusive quem não tem o app) vê o que
// foi relatado no bairro e o que a prefeitura já resolveu. Transparência.

const CENTER = [-23.4885, -46.7255]; // Pirituba, SP

function markerIcon(status, isNew) {
  const s = STATUS[status] || STATUS.recebido;
  const shapes = {
    circle: '<circle cx="14" cy="14" r="10"/>',
    diamond: '<path d="M14 3l11 11-11 11L3 14z"/>',
    square: '<rect x="5" y="5" width="18" height="18" rx="3"/>',
    check: '<circle cx="14" cy="14" r="10"/><path d="m9 14 3.5 3.5L19 11" stroke="#fff" stroke-width="2.5" fill="none"/>',
    x: '<circle cx="14" cy="14" r="10"/><path d="M10 10l8 8M18 10l-8 8" stroke="#fff" stroke-width="2.5"/>',
  };
  return L.divIcon({
    className: `map-marker${isNew ? ' map-marker-new' : ''}`,
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><g fill="${s.color}" stroke="#fff" stroke-width="2">${shapes[s.shape]}</g></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export async function mount(root) {
  root.insertAdjacentHTML(
    'beforeend',
    `
    <section class="hero">
      <div class="container hero-inner">
        <div>
          <p class="eyebrow">Pirituba · São Paulo</p>
          <h1>O que o bairro está relatando</h1>
          <p class="lead">Moradores relatam pelo app Zela. A subprefeitura responde por aqui. Todo mundo acompanha.</p>
        </div>
        <dl class="stats" aria-label="Resumo dos relatos">
          <div class="stat"><dt>Abertos</dt><dd id="st-abertos">–</dd></div>
          <div class="stat"><dt>Em andamento</dt><dd id="st-andamento">–</dd></div>
          <div class="stat"><dt>Resolvidos</dt><dd id="st-resolvidos">–</dd></div>
          <div class="stat"><dt>Média para resolver</dt><dd id="st-media">–</dd></div>
        </dl>
      </div>
    </section>

    <section class="container section" aria-labelledby="mapa-titulo">
      <div class="section-head">
        <h2 id="mapa-titulo">Mapa dos relatos</h2>
        <form class="filters" aria-label="Filtrar relatos">
          <label>Situação
            <select name="status">
              <option value="">Todas</option>
              ${Object.entries(STATUS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('')}
            </select>
          </label>
          <label>Tipo
            <select name="category">
              <option value="">Todos</option>
              ${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}
            </select>
          </label>
        </form>
      </div>

      <ul class="legend" aria-label="Legenda do mapa">
        ${Object.values(STATUS).map((s) => `<li><span class="legend-mark" style="--c:${s.color}" data-shape="${s.shape}" aria-hidden="true"></span>${s.label}</li>`).join('')}
      </ul>

      <div class="map-wrap">
        <div id="mapa" class="map" role="region" aria-label="Mapa interativo dos relatos. A mesma informação está na lista abaixo."></div>
      </div>

      <h2 class="list-title" id="lista-titulo">Lista dos relatos <span class="count" id="count"></span></h2>
      <ul class="report-list" id="lista" aria-labelledby="lista-titulo"></ul>
    </section>

    <section class="container section cta-app" aria-labelledby="app-titulo">
      <div>${icon('phone', 40)}</div>
      <div>
        <h2 id="app-titulo">Viu um problema na rua?</h2>
        <p>Relate pelo app Zela em menos de 30 segundos — funciona até sem internet e avisa você a cada mudança.</p>
      </div>
      <a class="btn btn-secondary" href="#/protocolo">Já relatou? Consulte o protocolo</a>
    </section>
  `
  );

  const map = L.map('mapa', { scrollWheelZoom: false, keyboard: true }).setView(CENTER, 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);
  const listEl = root.querySelector('#lista');
  const form = root.querySelector('.filters');
  let reports = [];

  const popup = (r) => `
    <strong>${esc(CATEGORIES[r.category]?.label)}</strong><br/>
    ${statusBadge(r.status)}<br/>
    ${r.address ? esc(r.address) + '<br/>' : ''}
    <small>${r.protocol} · ${timeAgo(r.created_at)} · ${r.supports_count} apoios</small>`;

  function draw(newId) {
    const fd = new FormData(form);
    const st = fd.get('status');
    const cat = fd.get('category');
    const visible = reports.filter((r) => (!st || r.status === st) && (!cat || r.category === cat));

    layer.clearLayers();
    visible.forEach((r) => {
      L.marker([r.lat, r.lng], {
        icon: markerIcon(r.status, r.id === newId),
        title: `${CATEGORIES[r.category]?.label}: ${STATUS[r.status]?.label}`,
        alt: `${CATEGORIES[r.category]?.label}: ${STATUS[r.status]?.label}`,
        keyboard: true,
      })
        .bindPopup(popup(r))
        .addTo(layer);
    });

    root.querySelector('#count').textContent = `(${visible.length})`;
    listEl.innerHTML = visible.length
      ? visible
          .map(
            (r, i) => `
        <li class="report-item${r.id === newId ? ' is-new' : ''}" style="--i:${Math.min(i, 10)}">
          ${r.photo_url ? `<img src="${esc(r.photo_url)}" alt="" loading="lazy" class="thumb" />` : `<div class="thumb thumb-icon">${icon(CATEGORIES[r.category]?.icon, 28)}</div>`}
          <div class="report-body">
            <h3>${categoryLabel(r.category)}</h3>
            ${r.address ? `<p class="muted">${icon('pin', 16)} ${esc(r.address)}</p>` : ''}
            ${r.description ? `<p>${esc(r.description)}</p>` : ''}
            <p class="meta">${statusBadge(r.status)} <span>${r.protocol}</span> <span>${timeAgo(r.created_at)}</span> <span>${icon('people', 16)} ${r.supports_count} apoios</span></p>
          </div>
        </li>`
          )
          .join('')
      : '<li class="empty">Nenhum relato com esses filtros.</li>';
  }

  function stats() {
    const open = reports.filter((r) => !['resolvido', 'recusado'].includes(r.status));
    const done = reports.filter((r) => r.status === 'resolvido');
    root.querySelector('#st-abertos').textContent = open.length;
    root.querySelector('#st-andamento').textContent = reports.filter((r) => r.status === 'em_andamento').length;
    root.querySelector('#st-resolvidos').textContent = done.length;
    const avg = done.length
      ? done.reduce((s, r) => s + (new Date(r.updated_at) - new Date(r.created_at)) / 86400000, 0) / done.length
      : null;
    root.querySelector('#st-media').textContent = avg == null ? '–' : `${avg.toFixed(1).replace('.', ',')} dias`;
  }

  form.addEventListener('change', () => draw());

  if (!isConfigured) return () => map.remove();

  listEl.innerHTML = Array.from({ length: 3 }, () => '<li class="report-item skeleton" aria-hidden="true"></li>').join('');
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) toast('Não foi possível carregar os relatos.', 'warn');
  reports = data || [];
  stats();
  draw();
  if (reports.length) map.fitBounds(reports.map((r) => [r.lat, r.lng]), { padding: [30, 30], maxZoom: 16, animate: !reducedMotion() });

  // Integração em tempo real: relato enviado pelo app aparece aqui na hora
  const channel = supabase
    .channel('publico')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        reports.unshift(payload.new);
        const label = CATEGORIES[payload.new.category]?.label;
        toast(`Novo relato: ${label}${payload.new.address ? ' — ' + payload.new.address : ''}`, 'new');
        announce(`Novo relato no mapa: ${label}`);
        stats();
        draw(payload.new.id);
      } else if (payload.eventType === 'UPDATE') {
        reports = reports.map((r) => (r.id === payload.new.id ? payload.new : r));
        stats();
        draw();
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    map.remove();
  };
}

export { daysOpen };
