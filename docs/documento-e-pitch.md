# Zela — rascunho do documento PDF e do vídeo-pitch

> Ajuste com o que o grupo observou no bairro. **Inclua falas reais de moradores** (o desafio pede para conversar com quem convive com o problema).

## 1. Integrantes (ordem alfabética)
- Kaillani da Silva Lima — RM565263
- …

## 2. Problema e cidadão beneficiado
**Cidadão:** o morador de Pirituba que anda a pé, de ônibus ou de carro pelo bairro. O foco são os mais afetados por problemas na rua: idosos, pessoas com deficiência e mães com carrinho de bebê.

**Problema:** buracos, postes apagados, entulho, calçadas quebradas e bocas de lobo entupidas ficam semanas sem solução. Isso acontece todos os dias, principalmente em vias de bairro e perto de pontos de ônibus, escolas e UBS.

**Por que acontece:** quem passa pelo problema não sabe onde reclamar e acha os canais oficiais longos. Quando reclama, não recebe retorno. A subprefeitura, por sua vez, recebe pedidos repetidos, sem foto e sem local exato, e não tem como saber o que é mais urgente.

**Justificativa:** é um problema real, frequente e visível, que afeta mais quem tem mobilidade reduzida. Uma solução digital simples encurta a distância entre o morador e o poder público.

## 3. Atores e jornadas

| Etapa | Morador (app) | Vizinho (app) | Agente da subprefeitura (web) | Público (web) |
|---|---|---|---|---|
| Entrada | Vê o problema na rua e abre o app | Abre o app e vê "Perto de você" | Faz login no painel no computador | Abre o link do mapa |
| Ação | Tipo → foto + GPS → enviar (3 toques) | "Eu também vi" | Lê a fila ordenada por prioridade e abre o detalhe | Filtra por tipo ou situação, ou consulta o protocolo |
| Dificuldade tratada | Sinal ruim → **fila offline**; pressa → etapas curtas | Relatos repetidos → **apoio** no lugar de duplicar | Excesso de pedidos → **prioridade automática** | Falta de retorno → **transparência** |
| Fim | Recebe aviso e vibração a cada mudança | Vê o problema subir na fila | Muda o status e escreve a mensagem | Acompanha os indicadores |

**Papel de cada plataforma:** o app vai para a rua (câmera, GPS, offline, vibração). A web fica na mesa do agente (tela grande, triagem, mapa) e é pública (transparência, acesso sem instalar nada).

## 4. Integração mobile ↔ web
Supabase (Postgres, Realtime, Storage e Auth). O relato criado no app aparece na hora no painel e no mapa. A mudança de status feita na web chega ao app em tempo real, e gatilhos no banco mantêm protocolo, linha do tempo e contagem de apoios. Veja o diagrama no README.

## 5. Decisões de design e UX
- **Identidade comum:** verde Zela (#0B5D4B), que remete a cuidado e cidade verde, com amarelo "sinal de trânsito" (#FFC83D) nas ações principais. App e web usam os mesmos tokens, ícones de traço e status.
- **Hierarquia:** uma ação principal por tela ("Relatar um problema"). No painel, a prioridade aparece primeiro em cada card.
- **Linguagem simples:** "Eu também vi", "Aguardando internet", "Não atendido" em vez de termos técnicos.
- **Prevenção de erro:** aviso de relato duplicado a menos de 80 m e validação do formato do protocolo.

## 6. Motion design (onde e para quê)
| Onde | Movimento | Função |
|---|---|---|
| App · Relatar | Barra de progresso cresce; etapa entra da direita | Mostra em que etapa a pessoa está |
| App · Botões | Escala 0,96 + vibração leve | Confirma o toque |
| App · Sucesso | Check "salta" (spring) | Confirma o envio |
| App · Status muda | Toast desce do topo + pulso no selo + timeline cresce | Avisa da mudança de estado |
| App · Listas | Entrada em cascata | Indica a ordem de leitura |
| Web · Troca de página | View Transitions | Dá continuidade à navegação |
| Web · Novo relato | Card desliza para a fila com brilho amarelo; marcador "cai" no mapa | Chama atenção para o que é novo |
| Web · Reordenação | Animação FLIP dos cards | Mostra para onde o item foi |
| Web · Carregamento | Skeleton | Indica que o conteúdo está chegando |
| Web · Erro | Leve "tremida" na mensagem | Indica o erro sem depender de cor |
Tudo é curto (160 a 420 ms) e é desligado com "Reduzir movimento".

## 7. Acessibilidade
Veja a lista no README: contraste AA, status por ícone + texto + forma, toque ≥ 56dp, leitores de tela, teclado, foco visível, fonte Atkinson Hyperlegible, `rem` e movimento reduzido.

## 8. ODS
- **ODS 11 — Cidades e comunidades sustentáveis (meta 11.2 e 11.7):** ruas e calçadas seguras e acessíveis, sobretudo para idosos e pessoas com deficiência.
- **ODS 16 — Paz, justiça e instituições eficazes (meta 16.6 e 16.7):** instituições transparentes, que prestam contas, e participação do cidadão.

## 9. Links
- GitHub: https://github.com/KaillaniSilva/zela
- Deploy web: https://zela-puce.vercel.app
- Vídeo: …

---

## Roteiro do vídeo (2min45)
| Tempo | Cena | Fala (resumo) |
|---|---|---|
| 0:00–0:20 | Imagens de buraco ou poste apagado no bairro, depoimento de morador | O problema e quem sofre com ele |
| 0:20–0:35 | Logo Zela | "O Zela liga quem vê o problema a quem resolve" |
| 0:35–1:15 | Tela do celular: relatar com foto, aviso de duplicado, envio | Jornada do morador, 3 toques, offline |
| 1:15–1:50 | Tela dividida: painel web recebe o relato ao vivo → agente muda status → celular vibra | **Integração em tempo real** |
| 1:50–2:15 | Mapa público, consulta de protocolo, celular no modo avião | Transparência e fila offline |
| 2:15–2:35 | Leitor de tela (TalkBack/VoiceOver), navegação por teclado, movimento reduzido | Acessibilidade e motion com função |
| 2:35–2:45 | ODS 11 e 16, integrantes | Encerramento |
