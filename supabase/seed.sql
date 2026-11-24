-- Dados iniciais (bairro de Pirituba, São Paulo).
-- Rode depois do schema.sql. Pode rodar de novo: apaga só os relatos de seed.

delete from public.reports where device_id = 'seed';

-- Agente da demonstração: crie o mesmo e-mail em Authentication › Users.
-- Para outros agentes: insert into public.agents (email) values ('nome@exemplo.com');
insert into public.agents (email) values ('agente@zela.app') on conflict do nothing;

with novos as (
  insert into public.reports (category, description, lat, lng, address, device_id, created_at)
  values
    ('calcada',     'Calçada levantada pela raiz da árvore em frente à UBS. Quem usa bengala ou andador tem que ir pela rua.', -23.4885, -46.7189, 'R. Ascêncio Ferreira, 85', 'seed', now() - interval '12 days'),
    ('iluminacao',  'Três postes apagados seguidos no caminho da padaria. À noite os idosos da rua não saem mais de casa.', -23.4902, -46.7221, 'R. Manuel Alves Mota, 300', 'seed', now() - interval '9 days'),
    ('ponto',       'Ponto de ônibus sem cobertura e com o banco quebrado. Quem espera o ônibus fica em pé no sol.',      -23.4911, -46.7250, 'Av. Raimundo Pereira de Magalhães, 11000', 'seed', now() - interval '8 days'),
    ('buraco',      'Buraco na faixa de pedestre perto do mercado. Já vi uma senhora tropeçar ao atravessar.',            -23.4867, -46.7265, 'Av. Mutinga, 1200', 'seed', now() - interval '7 days'),
    ('mato',        'Mato alto tomou a praça e escondeu os bancos. O grupo de caminhada da terceira idade parou de usar.', -23.4841, -46.7302, 'Praça Dom Hélder, s/n', 'seed', now() - interval '6 days'),
    ('lixo',        'Entulho jogado na calçada da esquina. Para passar é preciso descer para a rua.',                     -23.4858, -46.7290, 'R. Comendador Feiz Zarzur, 210', 'seed', now() - interval '4 days'),
    ('arvore',      'Galho grande pendurado sobre a calçada depois da chuva, bem na saída do centro de convivência.',     -23.4923, -46.7287, 'R. Pirituba, 940', 'seed', now() - interval '3 days'),
    ('calcada',     'Degrau alto e sem rampa na calçada da farmácia. Difícil subir com carrinho de feira.',               -23.4895, -46.7235, 'R. Dr. Paulo Lauro, 120', 'seed', now() - interval '2 days'),
    ('alagamento',  'Boca de lobo entupida. Quando chove a esquina vira um rio e não dá para atravessar.',                -23.4856, -46.7241, 'R. Dr. Paulo Lauro, 410', 'seed', now() - interval '1 day'),
    ('sinalizacao', 'Semáforo de pedestre fecha muito rápido. Não dá tempo de atravessar a avenida andando devagar.',      -23.4878, -46.7320, 'Av. Mutinga, 2050', 'seed', now() - interval '20 hours'),
    ('ponto',       'Ponto de ônibus sem iluminação. À noite o motorista não vê quem está esperando.',                   -23.4870, -46.7212, 'R. Ascêncio Ferreira, 560', 'seed', now() - interval '6 hours'),
    ('buraco',      'Buraco bem na descida do ônibus. A gente pisa nele ao descer do degrau.',                            -23.4917, -46.7258, 'Av. Raimundo Pereira de Magalhães, 10850', 'seed', now() - interval '3 hours')
  returning id, category, created_at
)
select count(*) from novos;

-- Avança alguns relatos na linha do tempo (trabalho do agente)
insert into public.report_events (report_id, status, note, author, created_at)
select id, 'em_analise', 'Equipe de zeladoria vai vistoriar o local.', 'agente', created_at + interval '1 day'
from public.reports where device_id = 'seed' and category in ('buraco','iluminacao','lixo','calcada','mato','ponto') and created_at < now() - interval '3 days';

insert into public.report_events (report_id, status, note, author, created_at)
select id, 'em_andamento', 'Serviço agendado com a equipe de manutenção.', 'agente', created_at + interval '2 days'
from public.reports where device_id = 'seed' and category in ('buraco','iluminacao','mato','calcada') and created_at < now() - interval '5 days';

insert into public.report_events (report_id, status, note, author, created_at)
select id, 'resolvido', 'Lâmpadas trocadas. Obrigado por avisar!', 'agente', created_at + interval '4 days'
from public.reports where device_id = 'seed' and category = 'iluminacao';

insert into public.report_events (report_id, status, note, author, created_at)
select id, 'resolvido', 'Praça roçada e bancos liberados. Bom passeio!', 'agente', created_at + interval '5 days'
from public.reports where device_id = 'seed' and category = 'mato';

-- O gatilho grava updated_at = now(); aqui usamos a data do último
-- evento, para a "Média para resolver" do mapa público ficar correta.
update public.reports r
   set updated_at = e.last_at
  from (select report_id, max(created_at) as last_at from public.report_events group by report_id) e
 where e.report_id = r.id and r.device_id = 'seed';

-- Apoios dos vizinhos
insert into public.supports (report_id, device_id)
select r.id, 'vizinho-' || g
from public.reports r, generate_series(1, 5) g
where r.device_id = 'seed' and r.category in ('buraco','calcada','alagamento','ponto')
on conflict do nothing;
