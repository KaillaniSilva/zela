# Zela — zeladoria colaborativa do bairro

> Projeto CitizenTech · FIAP. O morador relata problemas da rua pelo app e a subprefeitura responde pela web. Tudo acontece em tempo real.

**Integrantes:**
- Kaillani da Silva Lima — RM565263

**Deploy da web:** https://zela-puce.vercel.app
**Vídeo-pitch:** _(link do YouTube)_

---

## O problema

Em Pirituba (São Paulo), buracos, postes apagados, entulho e calçadas quebradas ficam semanas sem solução. Quem passa pelo problema não sabe onde reclamar, e quando reclama não recebe retorno. A subprefeitura recebe pedidos repetidos e sem foto nem localização exata, então não consegue saber o que é mais urgente.

## A solução

| Plataforma | Quem usa | Para quê |
|---|---|---|
| **App (Expo / React Native)** | Morador na rua, com pressa, sinal ruim | Relata em 3 toques (tipo → foto + GPS → enviar), funciona **offline**, avisa quando a prefeitura muda o status e permite **apoiar** problemas já relatados |
| **Web — Mapa do bairro** (público) | Qualquer morador, imprensa, associação de bairro | Mapa e lista de tudo o que foi relatado, com indicadores de transparência |
| **Web — Consultar protocolo** (público) | Quem relatou sem app, ou um familiar que acompanha | Linha do tempo do relato a partir do protocolo `ZL-XXXXXX` |
| **Web — Painel da subprefeitura** (login) | Agente de zeladoria, no computador | Fila ordenada por **prioridade** (apoios + tempo aberto + risco), atualiza o status e manda mensagem ao morador |

## Como funciona a integração

As duas plataformas usam o mesmo projeto **Supabase** (Postgres, Realtime, Storage e Auth).

```
 APP (morador)                    SUPABASE                      WEB (agente/público)
 ─────────────                    ────────                      ────────────────────
 envia relato + foto ──insert──▶ reports / storage ──realtime──▶ entra na fila com destaque "Novo"
                                                                 aparece no mapa público
 "Eu também vi" ───────insert──▶ supports (+1 apoio) ─realtime──▶ prioridade sobe na fila
 recebe aviso + vibração ◀─realtime── reports.status ◀──trigger── agente salva novo status
 linha do tempo atualiza ◀─realtime── report_events  ◀──insert─── (report_events + nota)
```

- **Fila offline:** sem internet, o relato fica guardado no aparelho (AsyncStorage) e é enviado sozinho quando o sinal volta (NetInfo).
- **Identidade anônima:** o app gera um ID por aparelho, então o morador não precisa criar conta.
- **Segurança:** políticas RLS (`supabase/schema.sql`). O cidadão (anon) só cria relatos e apoios. Só muda status quem está logado **e** tem o e-mail na tabela `agents`. O bucket de fotos aceita só imagens de até 5 MB.
- **Gatilhos no banco:** geram o protocolo, criam o 1º evento da linha do tempo, sincronizam o status e contam os apoios.

## Estrutura

```
zela/
├── app/          # App Expo (expo-router) — src/app = telas, src/components, src/lib
├── web/          # Plataforma web (Vite + JS puro + Leaflet)
├── supabase/     # schema.sql (tabelas, RLS, triggers, realtime, storage) e seed.sql
└── docs/         # rascunho do documento e roteiro do vídeo
```

## Dados da demonstração

Os relatos iniciais (`supabase/seed.sql`) são **simulados**, com endereços de Pirituba, como o desafio permite. Todo o fluxo entre app e web é real: cada relato enviado pelo app grava no mesmo banco que a web lê.

## Como rodar

O app e a web já vêm conectados ao Supabase da demonstração (a chave *publishable* é pública por design; quem protege os dados são as políticas RLS). Basta instalar e abrir:

```bash
# App (leia o QR code com o Expo Go, no Android ou iOS)
cd app && npm install && npx expo start

# Web (http://localhost:5173)
cd web && npm install && npm run dev
```

O painel da subprefeitura (`/painel`) pede login de agente: `agente@zela.app` (a senha é informada no documento da entrega).

### Usar o seu próprio Supabase (opcional)

#### 1. Banco
1. Crie um projeto grátis em supabase.com.
2. Em **SQL Editor**, rode `supabase/schema.sql` e depois `supabase/seed.sql`.
3. Em **Authentication › Users › Add user**, crie o agente **`agente@zela.app`** com uma senha (marque *Auto Confirm User*). O `seed.sql` já coloca esse e-mail na lista de agentes. Para outro e-mail, rode `insert into public.agents (email) values ('outro@email.com');`.
4. Em **Authentication › Sign In / Providers**, desligue **Allow new users to sign up**. Só a lista `agents` pode mudar status, mas assim ninguém cria conta pela chave pública.
5. Em **Project Settings › API Keys**, copie a *Project URL* e a *publishable key*.

#### 2. Chaves
Copie `app/.env.example` para `app/.env` e `web/.env.example` para `web/.env` e cole a URL e a chave. Sem esses arquivos, o projeto usa o Supabase da demonstração.

#### 3. Deploy da web (Vercel)
Importe o repositório no Vercel, use **Root Directory = `web`** (framework Vite) e adicione as duas variáveis `VITE_SUPABASE_*`. O build sai em `web/dist`.

## Demonstração da integração (roteiro rápido)
1. Abra o painel web logado e o app lado a lado.
2. No app, relate um "Buraco na rua" com foto → o card entra na fila web com destaque amarelo e aparece um aviso.
3. Na web, mude para "Em andamento" com uma mensagem → o celular vibra, mostra o aviso e a linha do tempo anda.
4. Ative o modo avião, relate outro problema → ele fica "Aguardando internet" → desligue o modo avião → ele é enviado sozinho.

## Acessibilidade aplicada
- Contraste ≥ 4.5:1 em todos os textos; status sempre com **ícone + texto + cor** (no mapa, também com **forma** diferente).
- App: áreas de toque ≥ 56dp, `accessibilityLabel`/`Role`/`Hint`/`State`, avisos com `announceForAccessibility`, fontes que acompanham o tamanho do sistema.
- Web: HTML semântico (`header/nav/main/aside/dl/ol`), skip link, foco visível, navegação por teclado (Esc fecha painéis), `aria-live` para novos relatos, fonte Atkinson Hyperlegible, tamanhos em `rem`.
- Movimento: respeita `prefers-reduced-motion` (web) e "Reduzir movimento" (iOS/Android).

## Tecnologias
Expo SDK 58 · React Native · expo-router · Supabase JS · Vite · Leaflet + OpenStreetMap
