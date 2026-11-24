# Zela — rascunho do documento e do vídeo-pitch

## 1. Autora
- Kaillani da Silva Lima — RM565263

## 2. Problema e cidadão beneficiado
**Cidadão:** pessoas com 60 anos ou mais que moram em Pirituba e dependem das calçadas, praças, pontos de ônibus e da iluminação pública para manter a rotina e a autonomia (UBS, feira, padaria, igreja, centro de convivência).

**Situações enfrentadas:**
- Calçada quebrada ou levantada por raiz, degrau sem rampa, buraco na faixa: todos os dias, no caminho mais curto. Medo de cair, troca de caminho.
- Poste apagado e ponto de ônibus sem luz: à noite a pessoa deixa de sair ou só sai acompanhada.
- Mato alto e entulho na praça: o banco some e a caminhada da manhã acaba.
- Ponto de ônibus sem banco nem cobertura, semáforo curto: cansaço e susto.

**Por que o problema continua:** os canais oficiais pedem cadastro, senha e muitos passos e quase nunca dão retorno. O idoso desiste ou pede a um familiar. A subprefeitura recebe pedidos repetidos, sem foto e sem local exato.

**Relação com a tecnologia:** celular Android simples, muitas vezes herdado da família, com fonte aumentada. Usa bem WhatsApp, câmera e chamada de vídeo. Tem dificuldade com cadastro e senha, botões pequenos, termos técnicos e telas que mudam sozinhas.

**Persona — Dona Cida, 71 anos:** aposentada, mora sozinha perto da Av. Mutinga. Caminha até a padaria todo dia e vai à UBS uma vez por mês. Celular com letra grande, fala com a filha pelo WhatsApp. Já tropeçou na calçada em frente à UBS e hoje faz um caminho mais longo.

**Roteiro da conversa com idosos:**
1. Que problema você encontra no caminho e com que frequência?
2. Alguma vez deixou de sair ou mudou o caminho por causa disso?
3. Qual celular você usa e para quê?
4. O que mais atrapalha quando usa um aplicativo?
5. Já tentou reclamar? Como foi?
6. Quem da família ou da vizinhança te ajuda com essas coisas?

**Pessoa 1 · moradora de Pirituba:** calçada quebrada e levantada por raízes no caminho da padaria, três vezes por semana; já tropeçou e, com chuva, muda de caminho. Galaxy A14, usa WhatsApp e previsão do tempo. Atrapalha: "letra pequena e menu escondido" e cadastro com código por mensagem. Abriu pedido no 156 com a filha, anotou o protocolo e "fiquei sem saber onde acompanhar". A filha ajuda com apps; a vizinha avisa sobre calçadas ruins.

**Pessoa 2 · Seu Marcos, 60 anos:** travessia perigosa na avenida para pegar o ônibus, quase todo dia; passou a andar até o semáforo e evita ruas escuras. Moto G54, usa WhatsApp, horário do ônibus, banco e mapa. Atrapalha: app lento ou que pede login de novo; "com sol batendo na tela [...] eu só quero abrir e ver". No 156 teve que voltar ao local para conferir o nome da rua; nada mudou. O filho ajuda com o celular; o vizinho do ponto avisa pelo WhatsApp.

**O que isso mudou no Zela:** sem cadastro nem login; texto grande e abas sempre visíveis; endereço preenchido pelo GPS; linha do tempo e avisos para acompanhar o protocolo; "Enviar para a família"; "Eu também vi" para os vizinhos.

## 3. Atores e jornadas

| Etapa | Idoso (app) | Familiar (web) | Vizinho (app) | Agente (web /painel) |
|---|---|---|---|---|
| Entrada | Vê a calçada quebrada e abre o app | Recebe o protocolo pelo WhatsApp | Vê "Perto de você" | Faz login no painel |
| Ação | Tipo → foto + GPS → enviar, sem cadastro | Abre o link e vê a linha do tempo | "Eu também vi" | Lê a fila por prioridade |
| Dificuldade tratada | Medo de errar: 3 etapas, botões grandes. Sem sinal: fila offline | Não quer instalar app | Relatos repetidos → apoio | Excesso de pedidos → prioridade automática |
| Fim | Recebe aviso e vibração; envia o protocolo para a família | Acompanha até "Resolvido" | Vê o problema subir na fila | Muda o status e escreve ao morador |

**Associação de moradores:** usa o Mapa do bairro e os indicadores para cobrar a subprefeitura com dados.

## 4. Integração mobile ↔ web
Supabase (Postgres, Realtime, Storage e Auth). O relato criado no app aparece na hora no painel e no mapa. A mudança de status feita na web chega ao celular do idoso em tempo real e aparece no link de protocolo que a família recebeu. Gatilhos no banco mantêm protocolo, linha do tempo e contagem de apoios.

## 5. Decisões guiadas pelo público idoso

| Dificuldade | Decisão |
|---|---|
| Cadastro e senha | Nenhum cadastro |
| Botões pequenos, mão trêmula | Toque ≥ 56dp, bem espaçado, com vibração |
| Letra pequena | Textos grandes que crescem com a fonte do sistema, contraste AA |
| Medo de errar | Uma ação por tela, barra de etapas, tela de sucesso |
| Usa WhatsApp para tudo | "Enviar para a família" |
| Sinal fraco | Fila offline, "Aguardando internet" |
| Termos técnicos | "Eu também vi", "Não atendido", "Calçada quebrada" |

## 6. Motion design (calmo, 160 a 420 ms)
| Onde | Movimento | Função |
|---|---|---|
| App · Relatar | Barra de progresso cresce; etapa entra da direita | Mostra em que etapa a pessoa está |
| App · Botões | Escala 0,96 + vibração leve | Confirma o toque |
| App · Sucesso | Check "salta" | Confirma o envio |
| App · Status muda | Toast desce do topo + pulso no selo + timeline cresce | Avisa da mudança de estado |
| App · Listas | Entrada em cascata | Indica a ordem de leitura |
| Web · Troca de página | View Transitions | Dá continuidade à navegação |
| Web · Novo relato | Card desliza com brilho amarelo; marcador "cai" no mapa | Chama atenção para o que é novo |
| Web · Reordenação | FLIP dos cards | Mostra para onde o item foi |
| Web · Carregamento / erro | Skeleton; leve "tremida" | Indica espera e erro sem depender de cor |

Nada pisca, nada fica se repetindo e o texto nunca sai do lugar enquanto a pessoa lê. Tudo desliga com "Reduzir movimento".

## 7. ODS
- **ODS 11 (metas 11.2 e 11.7):** espaços públicos seguros, inclusivos e acessíveis, em especial para pessoas idosas.
- **ODS 16 (metas 16.6 e 16.7):** instituições transparentes e participação do cidadão.

## 8. Links
- GitHub: https://github.com/KaillaniSilva/zela
- Deploy web: https://zela-puce.vercel.app
- Vídeo: …

---

## Roteiro do vídeo (2min45)
| Tempo | Cena | Fala (resumo) |
|---|---|---|
| 0:00–0:20 | Calçada quebrada, poste apagado, praça com mato; fala de uma pessoa idosa | Para muita gente é incômodo; para o idoso é uma queda ou ficar em casa |
| 0:20–0:35 | Logo Zela | "O Zela liga quem vê o problema a quem resolve, e a família acompanha" |
| 0:35–1:10 | Celular: relatar calçada quebrada com foto, botões grandes, envio | Jornada do idoso: 3 toques, sem cadastro |
| 1:10–1:25 | "Enviar para a família" → WhatsApp → link abre na web | Jornada do familiar |
| 1:25–1:55 | Tela dividida: painel recebe o relato ao vivo → agente muda status → celular vibra | **Integração em tempo real** |
| 1:55–2:15 | Mapa público, modo avião (fila offline) | Transparência e sinal fraco |
| 2:15–2:35 | Fonte grande do sistema, TalkBack, movimento reduzido | Acessibilidade e motion calmo |
| 2:35–2:45 | ODS 11 e 16, autora | Encerramento |
