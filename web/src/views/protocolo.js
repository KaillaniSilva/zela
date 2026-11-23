import { supabase } from '../supabase.js';
import { CATEGORIES, FLOW, STATUS, esc, formatDate } from '../data.js';
import { icon } from '../icons.js';
import { announce, categoryLabel, statusBadge } from '../ui.js';

// Consulta por protocolo: para quem relatou por outro celular, por telefone
// com um familiar, ou para o agente comunitário acompanhar sem o app.

export function timelineHTML(report, events) {
  const refused = report.status === 'recusado';
  const steps = refused ? ['recebido', 'em_analise', 'recusado'] : FLOW;
  const currentIdx = steps.indexOf(report.status);
  return `
    <ol class="timeline" style="--progress:${Math.max(0, currentIdx) / (steps.length - 1)}">
      ${steps
        .map((st, i) => {
          const s = STATUS[st];
          const done = i <= currentIdx;
          const ev = [...events].reverse().find((e) => e.status === st);
          return `<li class="tl-step ${done ? 'done' : ''}" style="--c:${s.color}; --i:${i}">
            <span class="tl-dot" aria-hidden="true">${icon(done ? 'check' : s.icon, 16)}</span>
            <div>
              <p class="tl-label">${s.label} <span class="sr-only">${done ? '(concluído)' : '(ainda não)'}</span></p>
              ${ev?.note ? `<p class="tl-note">${esc(ev.note)}</p>` : ''}
              ${ev ? `<p class="tl-time"><time datetime="${ev.created_at}">${formatDate(ev.created_at)}</time></p>` : ''}
            </div>
          </li>`;
        })
        .join('')}
    </ol>`;
}

export async function mount(root, params) {
  root.insertAdjacentHTML(
    'beforeend',
    `<section class="container section narrow">
      <h1>Consultar protocolo</h1>
      <p class="lead">Digite o protocolo que aparece no app depois do envio (ex.: ZL-AB12CD).</p>
      <form class="search-form" novalidate>
        <label for="proto">Protocolo</label>
        <div class="input-row">
          <input id="proto" name="proto" autocomplete="off" autocapitalize="characters" placeholder="ZL-" required aria-describedby="proto-erro" />
          <button class="btn" type="submit">${icon('search')} Consultar</button>
        </div>
        <p id="proto-erro" class="field-error" role="alert"></p>
      </form>
      <div id="resultado" aria-live="polite"></div>
    </section>`
  );

  const form = root.querySelector('form');
  const input = root.querySelector('#proto');
  const err = root.querySelector('#proto-erro');
  const out = root.querySelector('#resultado');
  let channel;

  async function lookup(code) {
    err.textContent = '';
    input.removeAttribute('aria-invalid');
    const { data: report } = await supabase.from('reports').select('*').eq('protocol', code).maybeSingle();
    if (!report) {
      err.textContent = 'Não encontramos esse protocolo. Confira as letras e números.';
      input.setAttribute('aria-invalid', 'true');
      out.innerHTML = '';
      input.focus();
      return;
    }
    const { data: events } = await supabase.from('report_events').select('*').eq('report_id', report.id).order('created_at');
    out.innerHTML = `
      <article class="card result-card">
        <header class="result-head">
          <h2>${categoryLabel(report.category)}</h2>
          ${statusBadge(report.status)}
        </header>
        ${report.photo_url ? `<img class="result-photo" src="${esc(report.photo_url)}" alt="Foto enviada pelo morador: ${esc(CATEGORIES[report.category]?.label)}" />` : ''}
        <p class="muted">${report.protocol} · ${report.address ? esc(report.address) : 'local marcado no mapa'}</p>
        ${report.description ? `<p>“${esc(report.description)}”</p>` : ''}
        <h3>Andamento</h3>
        ${timelineHTML(report, events || [])}
      </article>`;
    announce(`Protocolo ${code}: ${STATUS[report.status].label}`);

    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`proto-${report.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_events', filter: `report_id=eq.${report.id}` }, () => lookup(code))
      .subscribe();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let code = input.value.trim().toUpperCase().replace(/\s/g, '');
    if (code && !code.startsWith('ZL-')) code = 'ZL-' + code.replace(/^ZL/, '');
    if (!/^ZL-[0-9A-F]{6}$/.test(code)) {
      err.textContent = 'O protocolo tem o formato ZL- seguido de 6 letras ou números.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    history.replaceState(null, '', `#/protocolo?p=${code}`);
    lookup(code);
  });

  const p = params.get('p');
  if (p) {
    input.value = p;
    lookup(p);
  }

  return () => channel && supabase.removeChannel(channel);
}
