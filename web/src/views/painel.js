import L from 'leaflet';
import { supabase, isConfigured } from '../supabase.js';
import { CATEGORIES, STATUS, esc, priority, timeAgo } from '../data.js';
import { icon } from '../icons.js';
import { announce, categoryLabel, flip, statusBadge, toast } from '../ui.js';
import { timelineHTML } from './protocolo.js';

// Painel do agente da subprefeitura: tria, prioriza e responde os relatos.
// Cada mudança de status chega no app do morador em tempo real.

export async function mount(root) {
  const { data } = isConfigured ? await supabase.auth.getSession() : { data: {} };
  if (!data?.session) return loginView(root);
  const { data: agent } = await supabase.rpc('is_agent');
  if (!agent) return notAgentView(root, data.session);
  return panelView(root, data.session);
}

function notAgentView(root, session) {
  root.insertAdjacentHTML(
    'beforeend',
    `<section class="container section narrow">
      <h1>Painel da subprefeitura</h1>
      <p class="alert" role="alert">A conta <strong>${esc(session.user.email)}</strong> não está cadastrada como agente de zeladoria.</p>
      <p class="muted small">Peça ao responsável para incluir este e-mail na tabela <code>agents</code> do Supabase.</p>
      <button class="btn btn-ghost" id="sair" type="button">${icon('logout')} Sair</button>
    </section>`
  );
  root.querySelector('#sair').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function loginView(root) {
  root.insertAdjacentHTML(
    'beforeend',
    `<section class="container section narrow">
      <h1>Painel da subprefeitura</h1>
      <p class="lead">Acesso restrito aos agentes de zeladoria.</p>
      <form class="card login-form" novalidate>
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" name="email" type="email" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="senha">Senha</label>
          <input id="senha" name="senha" type="password" autocomplete="current-password" required />
        </div>
        <p class="field-error" role="alert" id="login-erro"></p>
        <button class="btn btn-block" type="submit">Entrar</button>
        <p class="muted small">Para a demonstração, crie um usuário em Supabase › Authentication › Users.</p>
      </form>
    </section>`
  );
  const form = root.querySelector('form');
  const err = root.querySelector('#login-erro');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    const { error } = await supabase.auth.signInWithPassword({ email: form.email.value, password: form.senha.value });
    if (error) {
      err.textContent = 'E-mail ou senha incorretos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      form.email.focus();
      return;
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

async function panelView(root, session) {
  root.insertAdjacentHTML(
    'beforeend',
    `<section class="container section painel">
      <div class="painel-head">
        <div>
          <p class="eyebrow">Subprefeitura · Zeladoria</p>
          <h1>Fila de relatos</h1>
        </div>
        <div class="painel-user">
          <span class="muted small">${esc(session.user.email)}</span>
          <button class="btn btn-ghost" id="sair" type="button">${icon('logout')} Sair</button>
        </div>
      </div>

      <dl class="kpis" aria-label="Indicadores">
        <div class="kpi"><dt>${icon('flame')} Prioridade alta</dt><dd id="k-alta">–</dd></div>
        <div class="kpi"><dt>${icon('inbox')} Aguardando análise</dt><dd id="k-novos">–</dd></div>
        <div class="kpi"><dt>${icon('tool')} Em andamento</dt><dd id="k-andamento">–</dd></div>
        <div class="kpi"><dt>${icon('check')} Resolvidos</dt><dd id="k-resolvidos">–</dd></div>
      </dl>

      <form class="toolbar" aria-label="Filtros da fila">
        <fieldset class="chips">
          <legend class="sr-only">Mostrar</legend>
          <label class="chip"><input type="radio" name="vista" value="abertos" checked /> Abertos</label>
          <label class="chip"><input type="radio" name="vista" value="todos" /> Todos</label>
          <label class="chip"><input type="radio" name="vista" value="fechados" /> Encerrados</label>
        </fieldset>
        <label>Tipo
          <select name="category"><option value="">Todos</option>
            ${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}
          </select>
        </label>
        <label>Ordenar
          <select name="ordem"><option value="prioridade">Prioridade</option><option value="recentes">Mais recentes</option></select>
        </label>
      </form>

      <div class="painel-grid">
        <ul class="queue" id="fila" aria-label="Relatos na fila"></ul>
        <aside class="detail" id="detalhe" aria-labelledby="det-titulo" tabindex="-1">
          <div class="detail-empty">
            ${icon('arrow', 28)}
            <p>Escolha um relato na fila para ver os detalhes e responder ao morador.</p>
          </div>
        </aside>
      </div>
    </section>`
  );

  const fila = root.querySelector('#fila');
  const detalhe = root.querySelector('#detalhe');
  const toolbar = root.querySelector('.toolbar');
  let reports = [];
  let selectedId = null;
  let miniMap = null;

  root.querySelector('#sair').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  function filtered() {
    const fd = new FormData(toolbar);
    const vista = fd.get('vista');
    const cat = fd.get('category');
    let list = reports.filter((r) => {
      const closed = ['resolvido', 'recusado'].includes(r.status);
      if (vista === 'abertos' && closed) return false;
      if (vista === 'fechados' && !closed) return false;
      return !cat || r.category === cat;
    });
    if (fd.get('ordem') === 'recentes') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else list.sort((a, b) => priority(b).score - priority(a).score);
    return list;
  }

  function kpis() {
    root.querySelector('#k-alta').textContent = reports.filter((r) => priority(r).level === 'alta').length;
    root.querySelector('#k-novos').textContent = reports.filter((r) => r.status === 'recebido').length;
    root.querySelector('#k-andamento').textContent = reports.filter((r) => r.status === 'em_andamento').length;
    root.querySelector('#k-resolvidos').textContent = reports.filter((r) => r.status === 'resolvido').length;
  }

  function itemHTML(r, flags = {}) {
    const p = priority(r);
    return `<li data-id="${r.id}" class="${flags.isNew ? 'is-new' : ''}${flags.updated ? ' is-updated' : ''}">
      <button type="button" class="queue-item" aria-pressed="${r.id === selectedId}" aria-controls="detalhe">
        <span class="prio prio-${p.level}">${icon(p.level === 'alta' ? 'flame' : 'clock', 16)}${p.label}</span>
        <span class="queue-title">${categoryLabel(r.category)}</span>
        <span class="muted small">${r.address ? esc(r.address) : 'Sem endereço'} · ${timeAgo(r.created_at)}</span>
        <span class="queue-meta">${statusBadge(r.status)}<span class="small">${icon('people', 16)} ${r.supports_count}</span><span class="small">${r.protocol}</span></span>
        ${flags.isNew ? '<span class="new-tag">Novo</span>' : ''}
      </button>
    </li>`;
  }

  function drawQueue(flags = {}) {
    const list = filtered();
    flip(fila, () => {
      fila.innerHTML = list.length
        ? list.map((r) => itemHTML(r, { isNew: r.id === flags.newId, updated: r.id === flags.updatedId })).join('')
        : '<li class="empty">Nenhum relato nesta visão. 🎉</li>';
    });
    kpis();
  }

  fila.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    selectedId = li.dataset.id;
    fila.querySelectorAll('.queue-item').forEach((b) => b.setAttribute('aria-pressed', String(b.closest('li').dataset.id === selectedId)));
    openDetail(selectedId);
  });
  toolbar.addEventListener('change', () => drawQueue());

  async function openDetail(id) {
    const r = reports.find((x) => x.id === id);
    if (!r) return;
    const { data: events } = await supabase.from('report_events').select('*').eq('report_id', id).order('created_at');
    miniMap?.remove();
    detalhe.innerHTML = `
      <div class="detail-inner">
        <button type="button" class="btn btn-ghost detail-back">${icon('arrow')} Voltar para a fila</button>
        <header class="result-head">
          <h2 id="det-titulo">${categoryLabel(r.category)}</h2>
          ${statusBadge(r.status)}
        </header>
        <p class="muted small">${r.protocol} · enviado ${timeAgo(r.created_at)} · ${icon('people', 16)} ${r.supports_count} vizinhos apoiam</p>
        ${r.photo_url ? `<img class="result-photo" src="${esc(r.photo_url)}" alt="Foto enviada pelo morador" />` : '<p class="muted">Relato sem foto.</p>'}
        ${r.address ? `<p>${icon('pin', 16)} ${esc(r.address)}</p>` : ''}
        ${r.description ? `<blockquote>${esc(r.description)}</blockquote>` : ''}
        <div class="mini-map" id="mini-mapa" role="img" aria-label="Local do problema no mapa"></div>

        <form class="status-form" novalidate>
          <fieldset>
            <legend>Atualizar situação</legend>
            <div class="status-options">
              ${Object.entries(STATUS)
                .map(
                  ([k, s]) => `<label class="status-opt" style="--c:${s.color}">
                    <input type="radio" name="status" value="${k}" ${k === r.status ? 'checked' : ''} />
                    ${icon(s.icon, 18)} ${s.label}</label>`
                )
                .join('')}
            </div>
          </fieldset>
          <div class="field">
            <label for="nota">Mensagem para o morador <span class="muted small">(aparece no app)</span></label>
            <textarea id="nota" name="nota" rows="3" maxlength="300" placeholder="Ex.: Equipe agendada para quinta-feira."></textarea>
          </div>
          <p class="field-error" role="alert" id="status-erro"></p>
          <button class="btn btn-block" type="submit">${icon('check')} Salvar e avisar o morador</button>
        </form>

        <h3>Histórico</h3>
        ${timelineHTML(r, events || [])}
      </div>`;

    detalhe.classList.add('open');
    detalhe.querySelector('h2').setAttribute('tabindex', '-1');
    detalhe.querySelector('h2').focus();

    miniMap = L.map('mini-mapa', { zoomControl: false, dragging: false, scrollWheelZoom: false, keyboard: false }).setView([r.lat, r.lng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(miniMap);
    L.circleMarker([r.lat, r.lng], { radius: 10, color: '#fff', weight: 3, fillColor: STATUS[r.status].color, fillOpacity: 1 }).addTo(miniMap);

    detalhe.querySelector('.detail-back').addEventListener('click', closeDetail);
    detalhe.querySelector('.status-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const status = form.status.value;
      const note = form.nota.value.trim();
      const errEl = form.querySelector('#status-erro');
      if (status === r.status && !note) {
        errEl.textContent = 'Escolha outra situação ou escreva uma mensagem para o morador.';
        return;
      }
      if (status === 'recusado' && !note) {
        errEl.textContent = 'Explique ao morador por que o relato não será atendido.';
        form.nota.focus();
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.classList.add('is-loading');
      const { error } = await supabase
        .from('report_events')
        .insert({ report_id: r.id, status, note: note || null, author: 'agente' });
      btn.disabled = false;
      btn.classList.remove('is-loading');
      if (error) {
        errEl.textContent = 'Não foi possível salvar. Tente de novo.';
        return;
      }
      toast(`${r.protocol}: ${STATUS[status].label}. O morador foi avisado no app.`, 'success');
      announce(`Situação salva: ${STATUS[status].label}`);
      // reflete na hora, sem esperar o realtime
      reports = reports.map((x) => (x.id === r.id ? { ...x, status, updated_at: new Date().toISOString() } : x));
      drawQueue({ updatedId: r.id });
      openDetail(r.id);
    });
  }

  function closeDetail() {
    detalhe.classList.remove('open');
    fila.querySelector(`li[data-id="${selectedId}"] button`)?.focus();
  }
  const onKey = (e) => e.key === 'Escape' && detalhe.classList.contains('open') && closeDetail();
  document.addEventListener('keydown', onKey);

  fila.innerHTML = Array.from({ length: 4 }, () => '<li class="queue-skeleton skeleton" aria-hidden="true"></li>').join('');
  const { data, error } = await supabase.from('reports').select('*').limit(500);
  if (error) toast('Erro ao carregar a fila.', 'warn');
  reports = data || [];
  drawQueue();

  // Tempo real: relato enviado pelo app entra na fila com destaque
  const channel = supabase
    .channel('painel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        reports.push(payload.new);
        drawQueue({ newId: payload.new.id });
        const label = CATEGORIES[payload.new.category]?.label;
        toast(`Novo relato na fila: ${label}`, 'new');
        announce(`Novo relato na fila: ${label}`);
      } else if (payload.eventType === 'UPDATE') {
        const before = reports.find((r) => r.id === payload.new.id);
        reports = reports.map((r) => (r.id === payload.new.id ? payload.new : r));
        if (before?.supports_count !== payload.new.supports_count || before?.status !== payload.new.status) {
          drawQueue({ updatedId: payload.new.id });
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    document.removeEventListener('keydown', onKey);
    miniMap?.remove();
  };
}
