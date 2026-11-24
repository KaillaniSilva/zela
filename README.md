# Zela — zeladoria colaborativa do bairro

> Projeto CitizenTech · FIAP. Ajuda pessoas idosas a relatar, acompanhar e se informar sobre problemas nas calçadas, praças, pontos de ônibus e iluminação do bairro. O idoso relata pelo app, a família acompanha e a subprefeitura responde pela web, tudo em tempo real.

**Autora:** Kaillani da Silva Lima — RM565263

**Deploy da web:** https://zela-puce.vercel.app
**Vídeo-pitch:** https://youtu.be/pbqbN4OStDw

---

## O problema

Em Pirituba (São Paulo), calçadas quebradas, buracos, postes apagados, entulho, mato alto nas praças e pontos de ônibus sem banco fazem parte do caminho de todo dia. Para a maioria das pessoas é um incômodo. Para quem tem 60 anos ou mais, pode ser uma queda, um caminho evitado ou a decisão de não sair de casa.

Os canais para reclamar exigem muitos passos, cadastro e telas confusas, e quase nunca dizem o que aconteceu depois. A subprefeitura, por sua vez, recebe pedidos repetidos, sem foto e sem local exato.

## Para quem

**Cidadão beneficiado:** pessoas com 60 anos ou mais que dependem das calçadas, praças, pontos de ônibus e da iluminação para manter a rotina e a autonomia (ir à UBS, à feira, à padaria, à igreja, ao centro de convivência).

**Relação com a tecnologia:** usam um celular Android de entrada, muitas vezes herdado de um familiar, com fonte aumentada. Usam bem WhatsApp, câmera e chamadas de vídeo. Têm dificuldade com cadastro e senha, botões pequenos, textos técnicos e telas que mudam rápido.

**Quem mais participa:**

| Ator | Onde entra | O que quer |
|---|---|---|
| **Idoso morador** | App | Relatar sem cadastro, com poucos toques, e saber se alguém vai resolver |
| **Familiar** (filho, neto) | Web — Consultar protocolo | Acompanhar o relato do pai ou da avó sem instalar nada |
| **Vizinho** | App | Confirmar um problema que também viu ("Eu também vi") |
| **Associação de moradores** | Web — Mapa do bairro | Ver o que está aberto e cobrar a subprefeitura com dados |
| **Agente da subprefeitura** | Web — Painel | Saber o que é mais urgente e dar retorno ao morador |

## A solução

| Plataforma | Quem usa | Para quê |
|---|---|---|
| **App (Expo / React Native)** | Idoso na rua, com o celular na mão, às vezes sem sinal | Relata em 3 toques (tipo → foto + GPS → enviar), sem cadastro, funciona **offline**, avisa quando a prefeitura muda o status e permite **apoiar** problemas já relatados |
| **Web — Mapa do bairro** (público) | Associação de moradores, vizinhos, imprensa | Mapa e lista de tudo o que foi relatado, com indicadores de transparência |
| **Web — Consultar protocolo** (público) | O familiar que acompanha o relato do idoso, no computador ou no celular | Linha do tempo do relato a partir do protocolo `ZL-XXXXXX` |
| **Web — Painel da subprefeitura** (login) | Agente de zeladoria, no computador | Fila ordenada por **prioridade** (apoios + tempo aberto + risco de queda), atualiza o status e manda mensagem ao morador |

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
- **Sem cadastro:** o app gera um ID por aparelho, então o idoso não precisa criar conta nem lembrar senha.
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
2. No app, relate uma "Calçada quebrada" com foto → o card entra na fila web com destaque amarelo e aparece um aviso.
3. Na web, mude para "Em andamento" com uma mensagem → o celular vibra, mostra o aviso e a linha do tempo anda.
4. Ative o modo avião, relate outro problema → ele fica "Aguardando internet" → desligue o modo avião → ele é enviado sozinho.

## Acessibilidade aplicada (pensada para quem tem 60+)
- Linguagem simples e direta, sem siglas: "Eu também vi", "Aguardando internet", "Não atendido".
- Contraste ≥ 4.5:1 em todos os textos; status sempre com **ícone + texto + cor** (no mapa, também com **forma** diferente).
- App: áreas de toque ≥ 56dp, `accessibilityLabel`/`Role`/`Hint`/`State`, avisos com `announceForAccessibility`, fontes que acompanham o tamanho do sistema.
- Web: HTML semântico (`header/nav/main/aside/dl/ol`), skip link, foco visível, navegação por teclado (Esc fecha painéis), `aria-live` para novos relatos, fonte Atkinson Hyperlegible, tamanhos em `rem`.
- Movimento calmo (160 a 420 ms, sem piscar nem girar) que nunca cobre o texto; respeita `prefers-reduced-motion` (web) e "Reduzir movimento" (iOS/Android).

## Tecnologias
Expo SDK 58 · React Native · expo-router · Supabase JS · Vite · Leaflet + OpenStreetMap
