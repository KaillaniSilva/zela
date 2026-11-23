-- =========================================================
-- Zela — schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- Tabelas ----------

create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  protocol       text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  category       text not null check (category in
                   ('buraco','iluminacao','lixo','calcada','arvore','alagamento','sinalizacao','outro')),
  description    text check (char_length(description) <= 500),
  photo_url      text,
  lat            double precision not null,
  lng            double precision not null,
  address        text,
  status         text not null default 'recebido' check (status in
                   ('recebido','em_analise','em_andamento','resolvido','recusado')),
  device_id      text not null,
  supports_count integer not null default 0
);

create table if not exists public.report_events (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  status     text not null check (status in
               ('recebido','em_analise','em_andamento','resolvido','recusado')),
  note       text check (char_length(note) <= 300),
  author     text not null default 'agente' check (author in ('cidadao','agente','sistema'))
);

create table if not exists public.supports (
  report_id  uuid not null references public.reports(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz not null default now(),
  primary key (report_id, device_id)
);

create index if not exists reports_status_idx  on public.reports(status);
create index if not exists reports_device_idx  on public.reports(device_id);
create index if not exists events_report_idx   on public.report_events(report_id, created_at);

-- ---------- Gatilhos ----------

-- Gera protocolo legível (ZL-AB12CD) e força status inicial
create or replace function public.reports_before_insert()
returns trigger language plpgsql as $$
begin
  new.protocol := 'ZL-' || upper(substr(replace(new.id::text, '-', ''), 1, 6));
  new.status := 'recebido';
  new.supports_count := 0;
  return new;
end $$;

drop trigger if exists trg_reports_before_insert on public.reports;
create trigger trg_reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- Cria o primeiro evento da linha do tempo
create or replace function public.reports_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.report_events (report_id, status, note, author, created_at)
  values (new.id, 'recebido', 'Relato enviado pelo cidadão', 'sistema', new.created_at);
  return new;
end $$;

drop trigger if exists trg_reports_after_insert on public.reports;
create trigger trg_reports_after_insert
  after insert on public.reports
  for each row execute function public.reports_after_insert();

-- Quando o agente registra um evento, o status do relato muda junto
create or replace function public.events_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.reports
     set status = new.status, updated_at = now()
   where id = new.report_id and status <> new.status;
  return new;
end $$;

drop trigger if exists trg_events_after_insert on public.report_events;
create trigger trg_events_after_insert
  after insert on public.report_events
  for each row execute function public.events_after_insert();

-- Contador de apoios ("eu também vi isso")
create or replace function public.supports_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.reports set supports_count = supports_count + 1 where id = new.report_id;
  return new;
end $$;

drop trigger if exists trg_supports_after_insert on public.supports;
create trigger trg_supports_after_insert
  after insert on public.supports
  for each row execute function public.supports_after_insert();

-- ---------- Agentes da subprefeitura ----------
-- Só quem está nesta lista pode mudar status. Estar logado não basta:
-- com a anon key qualquer pessoa conseguiria criar uma conta no Supabase.
create table if not exists public.agents (
  email text primary key
);

create or replace function public.is_agent()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.agents where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_agent() to anon, authenticated;

-- ---------- Segurança (RLS) ----------
-- Cidadão (anon): lê tudo, cria relatos e apoios.
-- Agente (e-mail em public.agents, logado no painel web): também muda status.

alter table public.agents        enable row level security;
alter table public.reports       enable row level security;
alter table public.report_events enable row level security;
alter table public.supports      enable row level security;

drop policy if exists "reports leitura publica" on public.reports;
create policy "reports leitura publica" on public.reports
  for select using (true);

drop policy if exists "reports cidadao cria" on public.reports;
create policy "reports cidadao cria" on public.reports
  for insert to anon, authenticated with check (true);

drop policy if exists "reports agente atualiza" on public.reports;
create policy "reports agente atualiza" on public.reports
  for update to authenticated using (public.is_agent()) with check (public.is_agent());

drop policy if exists "events leitura publica" on public.report_events;
create policy "events leitura publica" on public.report_events
  for select using (true);

drop policy if exists "events agente cria" on public.report_events;
create policy "events agente cria" on public.report_events
  for insert to authenticated with check (author = 'agente' and public.is_agent());

drop policy if exists "supports leitura publica" on public.supports;
create policy "supports leitura publica" on public.supports
  for select using (true);

drop policy if exists "supports cidadao cria" on public.supports;
create policy "supports cidadao cria" on public.supports
  for insert to anon, authenticated with check (true);

-- ---------- Permissões da API ----------
-- Explícitas: funcionam mesmo se o projeto foi criado sem "Grant API access
-- to new tables automatically". O que cada um pode fazer de fato é decidido
-- pelas políticas RLS acima.
grant usage on schema public to anon, authenticated;
grant select, insert         on public.reports       to anon, authenticated;
grant update                 on public.reports       to authenticated;
grant select                 on public.report_events to anon;
grant select, insert         on public.report_events to authenticated;
grant select, insert         on public.supports      to anon, authenticated;
revoke all                   on public.agents        from anon, authenticated;

-- ---------- Realtime ----------
-- replica identity full: o app recebe o status antigo e o novo, e só
-- avisa o cidadão quando o status realmente mudou.
alter table public.reports replica identity full;
do $$
begin
  begin alter publication supabase_realtime add table public.reports;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.report_events; exception when duplicate_object then null; end;
end $$;

-- ---------- Storage (fotos) ----------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- Só imagens, até 5 MB: evita uso do bucket para outros arquivos
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'fotos';

drop policy if exists "fotos upload cidadao" on storage.objects;
create policy "fotos upload cidadao" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos');

drop policy if exists "fotos leitura publica" on storage.objects;
create policy "fotos leitura publica" on storage.objects
  for select using (bucket_id = 'fotos');
