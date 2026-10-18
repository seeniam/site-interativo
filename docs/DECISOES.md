# Decisões do projeto

Registro de PO/PMO: o que cada fase entrega, o que fica fora, e as premissas assumidas.
Fonte de requisitos: `docs/BRIEFING.md`. O que falta do cliente está em `docs/PENDENCIAS.md`.

---

## Decisões gerais (valem para todas as fases)

| # | Decisão | Motivo |
|---|---------|--------|
| G1 | Casal: **Jaqueline & Diorlando**, nesta ordem; monograma **"J & D"**. | Informado pelo cliente na abertura do projeto. O briefing usava "N & L" como exemplo. |
| G2 | A foto do casal está em `public/images/casal.jpeg` (extensão `.jpeg`, não `.jpg`). O arquivo original não foi renomeado; o caminho correto fica em `src/config/casamento.ts`. | Não alterar arquivos do cliente sem necessidade. |
| G3 | Campos ainda não fornecidos pelo cliente são representados no config por um valor tipado `pendente("descrição")`, em vez de string vazia ou comentário `TODO`. A interface renderiza esses campos como placeholder elegante. | O briefing proíbe TODO esquecido no código e proíbe "undefined" na tela. Um tipo explícito obriga cada componente a tratar o caso pendente — o compilador cobra, não a memória. |
| G4 | O monograma não depende de fonte carregada: os contornos de "J", "D" (Cormorant Garamond) e "&" (Pinyon Script) são extraídos uma única vez por script (`scripts/extrair-glifos.ts`) e gravados como paths SVG. | Permite o efeito de "desenhar" com `stroke-dasharray` em contornos reais, sem custo de fonte no LCP e sem flash de fonte na abertura. |
| G5 | Tokens de cor existem com os nomes exatos do briefing (`--papel`, `--ouro`…) em `:root`, mapeados para utilitários Tailwind via `@theme inline` (`bg-papel`, `text-ouro-escuro`…). | Fidelidade ao briefing + ergonomia do Tailwind v4. |
| G6 | Gerenciador de pacotes: pnpm. Node local: v26. | Briefing, seção 5. |
| G7 | A mensagem pré-preenchida do WhatsApp mantém o 💛 que o cliente escreveu. É a única exceção à proibição de emoji, e o teste `scripts/higiene.test.ts` a isola pelo nome do campo. | A seção 9 proíbe emoji **na interface**. A mensagem é texto do casal que sai do celular do convidado, não aparece no site. Se o casal preferir sem, é uma linha no config. |
| G8 | A microcopy da interface (rótulos, botões, estados) vive em `src/config/textos.ts`; o conteúdo do casal em `src/config/casamento.ts`. Textos do `/design-system` (página interna de documentação) ficam na própria página. | Briefing 4: nenhum texto dentro de componente. Separar voz da interface de conteúdo do casal deixa claro o que o casal edita. |
| G9 | Valores enviados pelo cliente mas com dúvida aberta (ano, de-para das cotas, recebedor PIX…) entram como valor real e ficam em `casamento.aConfirmar` (PENDENCIAS C1–C7). Só o que **não** foi enviado vira `pendente(...)`. *(Revisada na Fase 1: o valor aparece com o selo "a confirmar" em qualquer tela enquanto a dúvida existir — briefing 4. Publicar exige zerar a lista.)* | Placeholder em dado que já existe esconderia informação real. |
| G10 | Briefing atualizado em 2026-10-17 (dados reais do casal, três cotas, card único de local, regras do PIX por telefone). A versão anterior foi substituída em `docs/BRIEFING.md`. | Mensagem do cliente durante a Fase 0. |

---

## Fase 0 — Fundação

**Data:** 2026-10-17

### O que vai ser feito
1. Projeto Next.js (App Router, versão estável mais recente), TypeScript strict, Tailwind CSS v4, ESLint, pasta `src/`, alias `@/*`, pnpm.
2. Tokens da seção 3.2 (cores, gradiente-ouro oficial, sombra quente, raios) em `src/app/globals.css`; `color-scheme: light` forçado.
3. Fontes via `next/font/google` (Cormorant Garamond 300/400 + itálico, Jost 300/400/500, Pinyon Script), subsets `latin` + `latin-ext`, `display: swap`. Pinyon sem preload (só aparece no rodapé).
4. `src/components/brand/`:
   - `Monograma.tsx` — SVG desenhável (contornos reais) com variante estática e animada.
   - `FileteDourado.tsx` — filete 1px × 56px com losango de 5px, a assinatura gráfica.
   - `icons/` — seis ícones de linha próprios (aliança, taça, igreja/altar, buquê, presente, talheres), grade 24px, traço 1.5px.
5. `src/config/casamento.ts` tipado, com os dados enviados pelo casal e o que falta como `pendente(...)`.
   Enquanto o convite não existe, `/` redireciona para `/design-system` (temporário, removido na Fase 3).
6. Rota `/design-system` (noindex): paleta, escala tipográfica, botões em todos os estados, filete, monograma, ícones, card de presente e card de convidado.
7. `scripts/screenshots.ts` (Playwright, 390×844 / 768×1024 / 1440×900, salva em `docs/qa/fase-N/`).
8. Base de QA: scripts `lint`, `typecheck`, `test` (Vitest), `build`, `test:e2e` (Playwright).

### Fora do escopo desta fase
- Qualquer rota do produto (`/`, `/presentear`, etc.), layout raiz com cabeçalho/barra inferior/rodapé (Fase 2).
- Abertura animada do convite com `sessionStorage` (Fase 2) — aqui o monograma só demonstra o traçado.
- PIX, `.ics`, formatadores, schemas zod, Firebase (Fase 1).
- OG image, manifest, favicon, sitemap (Fase 7).

### Ajustes feitos durante a fase (briefing atualizado)
- `casamento.ts` passou a ter os dados reais: data, local, versículo, PIX, WhatsApp, três cotas com ícone próprio, `noivos.titulo` e `noivos.monograma`.
- O tipo `Local` é uma união discriminada por `cerimoniaNoMesmoLocal`: com `false`, o compilador exige os dados da cerimônia. O componente de um ou dois cards é da Fase 3.
- `CardPresente` ganhou a prop `icone` (cada cota usa um ícone diferente — briefing 6.2).
- O `/design-system` mostra as três cotas reais e lista as pendências lidas do config inteiro (`listarPendencias`), em vez de uma lista manual que envelhece.
- `lib/format.ts` foi antecipado só no mínimo que os cards precisam (BRL, dia/mês), com testes; a Fase 1 completa.

### Anotado para as próximas fases (veio no briefing novo)
- **Fase 1:** payload PIX com a chave em `+5598999676346`; testes dos limites (nome ≤ 25, cidade ≤ 15, chave formatada) e leitura do QR de volta com `jsqr`.
- **Fase 3:** card único do Espaço Max com "Copiar endereço", "Ver no mapa" e "Adicionar à agenda"; dois cards se `cerimoniaNoMesmoLocal` virar `false`.
- **Fase 4:** três cotas como três planos (não grade genérica), Ouro em destaque, linha "Prefere outro valor? Fale com a gente" → WhatsApp. Selo "mais escolhida" só com dado real.

### Premissas
- Os componentes de botão e cards criados para o design system são os **componentes reais** que as fases seguintes vão consumir, não maquetes.
- Os exemplos do card de convidado e do card de presente no `/design-system` usam dados de exemplo **rotulados como exemplo**; nunca aparecem em rota pública.
- Testes unitários desta fase cobrem o que é lógica nesta fase: helper `pendente`, e contraste AA dos pares de cor de texto (garante que ninguém troque `--ouro-escuro` por `--ouro` em texto).

### Fechamento da Fase 0 (2026-10-17)

**Portão:** `pnpm qa:fase` verde — Prettier, ESLint (0 avisos), `tsc` strict, Vitest 116/116,
`next build` (3 rotas estáticas), Playwright 48/48 em 390/768/1440 (inclui axe WCAG 2.2 AA).
Screenshots em `docs/qa/fase-0/` (390, 768, 1440), revisados contra as seções 3 e 9.

**Revisão adversarial** (4 revisores independentes + 1 cético por lente): 22 achados
confirmados, 9 descartados. Todos os confirmados foram corrigidos:
- "&" do monograma do tamanho das capitulares → reduzido a ~67% da altura do D (briefing 3.3), com teste de proporção.
- Erro de hidratação (React #418) com movimento reduzido → hook `usePrefereMenosMovimento` (`useSyncExternalStore`); o E2E agora falha em qualquer `pageerror` ou erro de console, e foi conferido que ele pega o bug antigo.
- Botão `carregando` deixava o formulário reenviar → vira `type="button"` enquanto carrega; teste de clique + Enter.
- Guarda de contraste com regex que nunca casava → varredura por bloco CSS, com teste que prova que o guarda detecta a combinação proibida.
- `--borda` na paleta documentada; gradiente do SVG conferido contra o CSS; `theme-color` vindo de `lib/tokens.ts` e testado.
- Letras do monograma lidas de `noivos.monograma` pelo script e conferidas por teste.
- Selo dos dados não enviados: "a definir" (antes "a confirmar", que em PENDENCIAS quer dizer outra coisa).
- `<dl>` do card de convidado válido; títulos sem pular nível; alvos de toque ≥ 44×44 (largura também); safe-area na calha; anel de foco conferido em todo focável (achou `transition-colors` desbotando o anel dos links); script de screenshots com porta livre e checagem de elemento vazando.

**Ponto levado ao cliente (não alterado):** o anel de foco em `--ouro` (#C9A227) sobre `--papel`
tem contraste de ~2,3:1, abaixo dos 3:1 que a WCAG 2.2 pede para indicador de foco. O briefing
(7.2) especifica exatamente `--ouro`, então foi mantido. Alternativa compatível com a identidade:
anel em `--ouro-escuro` (~4,7:1). Decisão do casal/briefing.

---

## Fase 1 — Dados, domínio e PIX

**Data:** 2026-10-17

### Correções vindas do cliente antes da fase
- **Anel de foco em `--ouro-escuro`** (briefing 7.2 corrigido): `--ouro` dava ~2,3:1 e reprovava no WCAG 1.4.11.
  Regra nova do briefing: contraste abaixo do mínimo é erro do documento — corrigir e registrar aqui.
- **Emoji só no corpo de mensagens para o WhatsApp** (briefing 9). Nunca em nó da página.
- **Vocabulário obrigatório** (briefing 4): "a confirmar" (dado chegou com dúvida) × "a definir" (dado não existe), com estilos distintos.

### O que vai ser feito
1. `src/types/`: tipos do domínio (config do casamento, presente, confirmação de presença, presente reservado). As interfaces saem de `config/casamento.ts`.
2. Schemas zod (`src/lib/schemas/`): formulário de RSVP com mensagens humanas, documento de confirmação, presente reservado, e validação do próprio config (limites do PIX).
3. `lib/pix.ts`: payload BR Code (EMV) puro, CRC16-CCITT (0x1021, início 0xFFFF), validação dos limites (nome ≤ 25, cidade ≤ 15, chave de telefone em `+55…`), normalização (maiúsculas, sem acento). Testes: payload conhecido do manual do Banco Central, valor de verificação do CRC, casos negativos e **leitura do QR de volta com `jsqr`**.
4. `lib/ics.ts`: arquivo `.ics` (RFC 5545: CRLF, escape, dobra de linha em 75 octetos, horário em UTC) e link do Google Calendar.
5. `lib/format.ts`: BRL, telefone (formatar, máscara progressiva para digitação, mascarar para privacidade), data por extenso pt-BR no fuso de Brasília, data curta, primeiro nome. Com date-fns + `@date-fns/tz`.
6. `lib/dados/`: repositórios de confirmações e presentes reservados com duas implementações — Firestore (SDK carregado sob demanda) e **mock local em `localStorage`** quando não houver `.env.local`. O mock propaga entre abas (evento `storage`) e permite simular falha de rede para os testes das Fases 5 e 6.
7. `firestore.rules`, `.env.example`.
8. Vocabulário: registro `aConfirmar` no config + selo "a confirmar" distinto do placeholder "a definir"; ambos no `/design-system`.
9. Anel de foco em `--ouro-escuro`.

### Fora do escopo
- Qualquer tela ou fluxo que use esses módulos (QR na tela, formulário, lista): Fases 3 a 6.
- Projeto Firebase real e deploy das regras: dependem das credenciais do casal.
- Teste das regras do Firestore no emulador (exige Java + Firebase CLI): fica registrado como pendência técnica.

### Decisões e premissas
| # | Decisão | Motivo |
|---|---------|--------|
| F1 | **Estilo "a confirmar": fundo `--champanhe`, filete de 1px em `--ouro`, ponto em `--ouro-escuro`, texto em `--tinta`.** "A definir" segue como no briefing: `--linho` com texto `--fumaca`. | O briefing pede texto `--ouro-escuro` sobre `--champanhe`, que dá 4,28:1 e reprova no AA (4,5) para texto de 12px. Pela regra 7.2, é erro do documento. O ouro continua marcando o estado (filete + ponto), e os dois selos seguem distintos. |
| F2 | **Confirmações são só de inclusão (append-only).** Cada resposta vira um documento novo; a resposta valendo para um telefone é a mais recente. "Atualizar resposta" cria outro documento. | O briefing bloqueia `update`/`delete` no Firestore e, ao mesmo tempo, exige "permitir sobrescrever" quando o telefone já confirmou. Inclusão + "vale a mais recente" atende os dois. De quebra fica o histórico. |
| F3 | **`presentes_reservados` também tem `read` liberado.** Os documentos guardam só `{ presenteId, criadoEm }`, sem dado pessoal. | O briefing libera `read` apenas em `confirmacoes`, mas o estado "já presenteado" de `/presentear` precisa ler `presentes_reservados`. Sem leitura, esse estado é impossível. |
| F4 | **Cotas não se esgotam;** só presentes nomeados ficam "já presenteado". | Várias pessoas podem dar a mesma cota. Hoje não há presentes nomeados (PENDENCIAS P8), então o estado existe no código e no design system, mas nenhuma cota o usa. |
| F5 | Horário de término **a definir** (P9): `agenda.duracaoHoras` é `pendente(...)` e a agenda usa o plano B de 6 horas (`DURACAO_PLANO_B_HORAS`). *(Corrigida na revisão: tinha sido marcada "a confirmar", mas o valor não veio do cliente.)* | Um evento `.ics` precisa de término e o cliente informou só o início. |
| F6 | `gerarPayloadPix` não altera o texto que recebe: valida (ASCII, limites) e recusa o que estiver fora. A normalização (maiúsculas, sem acento) fica em `normalizarCampoPix`, aplicada ao montar o PIX a partir do config. | Função pura e previsível, testável contra o exemplo oficial do Banco Central, que usa letras minúsculas. |
| F7 | Datas no fuso de Brasília via `Intl.formatToParts` + date-fns (locale pt-BR), sem `@date-fns/tz`. Os testes unitários rodam no fuso de Tóquio (UTC+9). | O construtor do `TZDate` chama `new Date()` sem argumento, e o Next 16 com cacheComponents recusa isso na pré-renderização (o build quebrou). O fuso de Tóquio nos testes prova que nada depende do relógio da máquina — e pegou um bug de conversão dupla que passaria em UTC-3. |

### Risco registrado (para decisão até a Fase 6)
**Telefones dos convidados ficam legíveis por qualquer pessoa.** Com `read` liberado em `confirmacoes` e chaves públicas no cliente, qualquer um que abra o console do navegador lê a coleção inteira, com telefones. O PIN de `/convidados` esconde a informação na tela, mas não protege o dado (o briefing já diz que é dissuasão). Saídas possíveis sem servidor: (a) guardar o telefone só mascarado e um hash para a idempotência, perdendo o "Mostrar telefones"; (b) Firebase Auth anônimo para os convidados e e-mail/senha para os noivos, com `read` só para os noivos. Fica para decisão do cliente antes da Fase 6.

### Fechamento da Fase 1 (2026-10-17)

**Portão:** `pnpm qa:fase` verde (ver relatório). Vitest roda a suíte inteira em dois fusos
(Tóquio e Nova York) — datas, agenda e PIX não dependem do relógio da máquina.

**Revisão adversarial** (4 revisores + 1 cético por lente): 19 achados confirmados, 6 descartados. Corrigidos:
- **Perda silenciosa de resposta** (3 revisores): nome de acompanhante > 120 era aceito, gravado e descartado na leitura. Limites agora num módulo só (`lib/schemas/limites.ts`); repositórios conferem com o esquema de leitura **antes** de gravar; regras do Firestore conferem cada nome; teste de propriedade "tudo que o formulário aprova, a leitura aceita".
- **Firebase pela metade em produção caía em silêncio na demonstração** (RSVPs só no celular de cada convidado): `escolherOrigem` agora dá erro com as chaves faltantes; produção sem Firebase só com `NEXT_PUBLIC_MODO_DEMONSTRACAO=1`.
- **Horário de verão de quem abre o convite** (Nova York, Lisboa) errava a hora: datas saem direto do `Intl` com o fuso de Brasília.
- Download do SDK falhando não virava `ErroDeRede`; inicialização com falha ficava presa no cache.
- Apóstrofo do iPhone (’) e acento decomposto recusados no nome; telefone colado com 0 de tronco embaralhado; "+55" aceito na máscara e recusado no validador.
- Quem responde "não" ficava preso em erros dos campos do passo que pulou.
- PIX: fração de centavo era arredondada em silêncio; chave e-mail aceitava acento e mais de 77 caracteres.
- Leitura aceitava `null`/número como data (virava 1970) e telefone que o app não formata.
- `crypto.randomUUID` quebrava a demonstração aberta por IP da rede local.
- `primeiroNome`: "Dr. João" → "João"; "Ana-Clara" e "D'Ávila" corretos.
- Testes fracos reforçados (inválidos de telefone, VALARM, chave do config por tipo).
- Vocabulário: término da festa movido de "a confirmar" para "a definir" (P9); C3 reescrito conforme o manual do BC.

**Nota de nomenclatura:** a "camada `lib/firebase`" do briefing é `src/lib/dados/` (Firestore + demonstração local atrás da mesma interface).

**Revisão automática de segurança:** apontou o mesmo risco já registrado — telefones legíveis por qualquer visitante com `read` público em `confirmacoes`. Mantido como decisão pendente do cliente (T2) porque contraria a seção 5 do briefing; recomendação no relatório da fase.

---

## Briefing atualizado após a Fase 1 (2026-10-17) — privacidade dos convidados

O cliente reescreveu a seção 5: **leitura de `confirmacoes` nunca é pública**. Só os noivos
leem (Firebase Auth, UIDs na regra); o aviso "você já confirmou" usa `rsvp_index/{sha256(telefone + SALT)}`
com `get` liberado e `list` bloqueado; teste de regras obrigatório com `@firebase/rules-unit-testing`.
A regra definitiva é escrita na Fase 5.

- **Risco da Fase 1 resolvido no briefing.** A exposição de telefones deixa de ser decisão pendente.
- **Feito agora (sem adiantar a Fase 5):** `firestore.rules` fecha a leitura de `confirmacoes` para todos
  até a regra definitiva, e a guarda estática reprova qualquer `read: if true` ali. Nenhuma tela lê a coleção hoje.
- **F2 confirmada pelo briefing:** atualizar resposta = documento novo (`atualizaDe`), nunca `update`.
- **F3 incorporada ao briefing:** `presentes_reservados` com leitura pública.

### Lacunas do texto novo, para fechar antes ou durante a Fase 5
1. **Escrita em `rsvp_index`:** o briefing define `get`/`list`, mas não `create`/`update`. Proposta: `create`
   só se o documento não existir, com `em == request.time`; reconfirmação atualiza `em` só para `request.time`
   (o campo não identifica ninguém); `delete` bloqueado.
2. **Atomicidade:** a resposta e o índice devem ir num *batch*, com a regra de `confirmacoes` exigindo
   `existsAfter(rsvp_index/...)` — senão uma falha no meio deixa resposta sem índice (aviso não aparece) ou o inverso.
3. **Agrupamento por pessoa:** "mais recente por hash" pede o hash em **toda** resposta (não só nas que têm
   `atualizaDe`). Proposta: campo `chave` (o hash) em todo documento de `confirmacoes`.
4. **Emulador para o teste obrigatório:** exige Java 11+ e firebase-tools, que não estão nesta máquina.
   Proposta: script `test:regras` com `firebase emulators:exec`, incluído no `qa:fase`; o `pnpm test`
   comum continua sem dependência de Java.
5. **Demonstração local:** sem Firebase, `/convidados` precisa de um login de demonstração (credencial fixa
   documentada), para o roteiro de 2 minutos do casal funcionar.
6. **SHA-256 no navegador** (`crypto.subtle`) só existe em contexto seguro (https ou localhost) — a demonstração
   aberta por IP da rede local não teria o aviso de "já confirmou".

---

# Briefing v3 (2026-10-17) — Postgres na Vercel, foto única, execução contínua

O cliente substituiu o briefing: sai o Firebase, entra **Postgres (Neon) acessado só por Route
Handlers**; sai a galeria (existe **uma** foto); todos os dados do casal estão **confirmados**
(recebedora "JAQUELINE BARROS ALVARES", 21/12/2026 segunda-feira intencional etc.). Pediu execução
contínua da Fase 1 (retrabalho) até a última fase, com portão e commit por fase.

## Premissas gerais desta rodada
| # | Premissa | Motivo |
|---|----------|--------|
| V1 | O pedido diz "até a Fase 10", mas a seção 10 termina na **Fase 7**. Executo até a 7. | Não há fases 8–10 descritas; inventá-las seria criar requisito. |
| V2 | **Cotas nunca se esgotam.** `presentes_reservados` e `POST /api/presentes/[id]/reservar` existem como pedido, mas só aceitam presentes **nomeados**; cota responde 400. *(Discordância registrada.)* | Com `cota_id` como chave primária, o primeiro presente na Cota Ouro a esgotaria para todos — só 3 presentes no total. E a rota é pública: qualquer visitante "esgotaria" as três cotas com um POST. Hoje não há presentes nomeados, então nada fica indisponível. |
| V3 | Sem `DATABASE_URL` → demonstração em memória (como pede o briefing), **exceto na produção da Vercel** (`VERCEL_ENV=production`) sem `DEMO=true`: aí é erro explícito. | Dado pessoal: um deploy que esqueceu o banco gravaria as respostas reais na memória e as perderia, e mostraria convidados fictícios aos noivos. |
| V4 | Foto continua em `public/images/casal.jpeg` (G2). | Arquivo original do cliente, não renomeado. |
| V5 | Selo "a confirmar" mantém F1 (texto em `--tinta`, ouro no filete e no ponto). | O briefing repete `--ouro-escuro` sobre `--champanhe` (4,28:1); a seção 7.2 manda acessibilidade vencer o token. |
| V6 | **FAQ escrito a partir dos dados confirmados** (data e dia útil, horário, local, presentes, confirmação, acompanhantes), na voz do casal, com valores interpolados do config — sem fato novo. Pergunta cuja resposta depende de dado "a definir" (traje, prazo) mostra o placeholder. | O briefing pede o FAQ com o aviso de dia útil e não lista o FAQ como "a definir". |
| V7 | Duração do evento na agenda (6 h) é **padrão técnico**, não pendência do cliente. | O briefing limita os "a definir" a três itens; a agenda precisa de um término. |

---

## Fase 1 (retrabalho) — dados no servidor

### O que vai ser feito
1. **Remover** `src/lib/dados/` (Firebase), `firestore.rules`, seus testes e a dependência `firebase`.
2. `db/schema.sql` exatamente como a seção 5.
3. `src/lib/db/` (só servidor, `server-only`): interface do repositório; adaptador **Postgres** (`@neondatabase/serverless`, SQL à mão, colunas explícitas, nunca `select *`) sobre um executor de consultas; adaptador **em memória com seed** (12 confirmações fictícias, telefones `(98) 90000-00XX`); escolha pelo ambiente (V3); `telefone_hash = sha256(telefone + RSVP_SALT)` calculado no servidor.
4. Testes do adaptador Postgres contra o **SQL real** do `db/schema.sql` em `pg-mem`, e do adaptador em memória.
5. Config com os dados confirmados; tipos sem galeria; "nossa história" vira `Talvez` de lista inteira (sem marcos, a seção não existe); `aConfirmar` fica vazio.
6. `.env.example` com `DATABASE_URL`, `SENHA_NOIVOS`, `SESSAO_SECRET`, `RSVP_SALT`, `DEMO` — nenhuma `NEXT_PUBLIC_`.

### Fora do escopo
- Route Handlers, sessão dos noivos e limite por IP: Fase 5 (e 6 para `/api/convidados`).

### Fechamento da Fase 1 (retrabalho)
- Firebase removido por inteiro (`lib/dados`, `firestore.rules`, testes, dependência).
- `db/schema.sql` igual à seção 5 (índice com nome explícito, para o arquivo rodar igual em qualquer Postgres).
- `src/lib/db/`: interface, adaptador Postgres (Neon HTTP, SQL à mão, colunas explícitas — teste garante que não há `select *`), adaptador em memória com seed de 12 respostas fictícias, hash do telefone no servidor, leitura do ambiente (V3). Entrada `index.ts` marcada `server-only`.
- O adaptador Postgres é testado contra o **`db/schema.sql` real** no `pg-mem`. Um detalhe do pg-mem (`on conflict do nothing returning` devolve linha mesmo ignorando) levou a reservar com `where not exists` + `on conflict` — correto nos dois.
- Config com os dados confirmados; sem galeria; "nossa história" = lista inteira "a definir" (sem marcos, sem seção); cotas sem frase (descrição vazia, como no briefing); FAQ a partir dos dados confirmados (V6).
- Os "a definir" ficaram exatamente os três do briefing (D1–D3).

---

## Fase 2 — Layout, navegação e abertura

### O que vai ser feito
1. Grupo de rotas `(convite)` com o layout do convite: **cabeçalho no desktop (≥ 768px)** que encolhe ao rolar, **barra inferior fixa no celular** (Convite · Presentear · Confirmar) com `backdrop-filter` e safe-area, que aparece só depois do herói (sem herói na página, aparece sempre), e **rodapé** (monograma, assinatura em Pinyon, link discreto para `/convidados`, créditos). O `/design-system` fica fora desse layout.
2. `not-found` com a identidade: monograma, "Esta página não existe no nosso convite", botão de volta.
3. **Abertura do convite** (3.5.1), uma vez por sessão.
4. Link "Pular para o conteúdo" (teclado e leitor de tela).

### Decisões
| # | Decisão | Motivo |
|---|---------|--------|
| L1 | A abertura é **CSS + um script inline no `<head>`**: o script lê o `sessionStorage` e marca `<html data-abertura>` antes da primeira pintura; o monograma se desenha com `stroke-dashoffset` em CSS, sobe, e a camada some sozinha. Sem JavaScript de animação. | Aparece antes da hidratação (sem "piscar" o herói), não pesa no bundle e não atrasa o LCP. Com `prefers-reduced-motion`, o script nem liga a abertura. |
| L2 | No celular não há cabeçalho no topo: a navegação é a barra inferior. | Briefing 6.1; o topo do celular é da foto. |
| L3 | Créditos do rodapé: "Foto: arquivo do casal". | O briefing pede créditos sem dizer quais; não invento autoria. |
| L4 | Até as Fases 3–6, os links para rotas que ainda não existem levam ao 404 com a identidade. | Não implementar fase futura adiantado. |

### Fora do escopo
- Conteúdo do convite (herói, seções): Fase 3. Nesta fase a home é o layout vazio.

### Fechamento da Fase 2
- Abertura em CSS + script no `<head>` (L1), conferida quadro a quadro (350/800/1150/1450 ms): traçado em ouro, preenchimento, brilho, monograma subindo e camada abrindo. Não repete na sessão, só na home, nunca com movimento reduzido — tudo coberto por E2E.
- Barra inferior recriada por rota (`key`) em vez de `setState` no corpo do efeito (regra do React Compiler).
- A fixture do E2E passou a reprovar **qualquer resposta HTTP ≥ 400** fora de uma lista explícita de rotas futuras (`e2e/fixtures.ts`), que encolhe a cada fase.
- Assinatura do rodapé em 25px no celular para não quebrar no "&".

---

## Fase 3 — `/` o convite

### O que vai ser feito
As seções da 6.1, nesta ordem: abertura (Fase 2) · **herói** · **contagem regressiva** (3 estados) ·
**nossa história** (só aparece com os marcos — hoje não aparece) · **recorte de detalhe 21:9** ·
**quando e onde** (card único; dois se `cerimoniaNoMesmoLocal` virar `false`) com "Ver no mapa",
"Copiar endereço", "Adicionar à agenda" (.ics + Google Agenda) e mapa que só carrega no clique ·
**trajes** · **presentes (teaser)** · **dúvidas frequentes** (`<details>`) · **faixa do RSVP** · rodapé.

### Decisões
| # | Decisão | Motivo |
|---|---------|--------|
| H1 | **Foto em exatamente dois lugares** no `/`: herói inteiro e o recorte 21:9 da mão. Teste E2E conta as imagens. | Briefing 3.7, "Economia da foto única". |
| H2 | Herói: no celular, foto em tela cheia (`100dvh`); no desktop, quadro 16:10 dentro do container de 1120px, com raio de 24px. | A foto tem 960px de largura: em tela cheia de 1440px ficaria visivelmente esticada. No container, a ampliação é pequena e o quadro mantém o 16:10 pedido. |
| H3 | Recorte 21:9 tratado como **textura**: zoom moderado (1,8×) nas **duas mãos — a dele, com a aliança, na cintura dela**, vinheta quente, grão sutil e filete dourado; no desktop a faixa fica contida em 760px. Abre do centro por `clip-path` uma vez. *(Revisada: nesta foto a mão dela, sobre o peito dele, não mostra anel; a única aliança visível é a dele. O briefing pede "a mão dela … com a aliança", impossível com esta foto — registrado.)* | Ampliar um trecho de uma foto de 960px perde nitidez; assumir a textura (em vez de fingir nitidez) é o que faz "ninguém perceber que é a mesma imagem". |
| H4 | Contagem: antes da cerimônia → dias/horas/minutos/segundos; **no dia 21/12 inteiro** (horário de Brasília) → "Hoje é o dia"; depois → "Casados desde 21.12.2026". A contagem é só no navegador (o servidor não sabe a hora de quem abre) e reserva o espaço para não haver salto de layout. | Briefing 6.1 item 3. "Quando a data passar" interpretado como "quando o dia chegar". |
| H5 | Botão de contorno sobre a foto usa texto branco e filete `--ouro-claro`. | `--ouro-escuro` sobre a foto escura não tem contraste (7.2: acessibilidade vence o token). |
| H6 | Paleta dos trajes com nome de cada cor no config ("Dourado", "Branco"). | O briefing pede "círculos com o nome da cor"; o nome é conteúdo, então mora no config. |
| H8 | Números em ouro (`texto-ouro`) usam um gradiente só com tons ≥ 3:1 (`#8C6B2F → #A9822A`), não o gradiente oficial. | O oficial passa por `#E8D08A`, ~1,5:1 sobre branco: ilegível como texto (7.2). Filetes, monograma e bordas seguem com o oficial. |
| H9 | Títulos em Cormorant evitam ê, ô e â ("Você vem?" virou "Vem com a gente?"). | O circunflexo da Cormorant é alto e estreito e parece descolado da letra nos tamanhos de título. |
| H7 | Toasts com `sonner` (`aria-live` próprio) para "Endereço copiado". | Briefing 5 e 7.6. |
| H10 | **Os nomes do herói são contornos SVG da Cormorant Light**, extraídos pelo mesmo script do monograma (`scripts/extrair-glifos.ts`), com o texto real em `sr-only`. | Aparecem na tipografia certa no primeiro quadro, sem trocar de fonte no 4G ruim — e deixam de depender da Cormorant para a pintura principal. |
| H11 | Só a **Cormorant itálica** (versículo, o maior texto da primeira dobra) e a **Jost** são pré-carregadas; a camada da abertura é 98% opaca, não 100%. | Pré-carregar tudo disputava banda com a primeira dobra; com a camada 100% opaca o Chromium adiava a pintura do herói por baixo. |
| H12 | **O Pinyon Script não é baixado**: o "&" e a assinatura do rodapé — seus únicos usos (3.3) — são contornos SVG da própria fonte. Fontes variáveis (Jost e Cormorant) em vez de um arquivo por peso. | De 7 arquivos de fonte (~220 KB) para 4 (~119 KB). A regra da 3.3 continua cumprida: o desenho é o do Pinyon. |
| H13 | **Orçamento de performance determinístico** no E2E (JS ≤ 190 KB, ≤ 4 fontes e ≤ 140 KB, imagem ≤ 300 KB, CLS ≈ 0) como portão local, no lugar da nota do Lighthouse. A nota ≥ 95 fica para o PageSpeed Insights após o deploy. | Nesta máquina (Ryzen 5 3500U com o Chrome do usuário aberto) o Lighthouse avisa que a CPU é mais lenta do que ele calibra, e a nota oscila de 53 a 76 com o mesmo build. |

### Fechamento da Fase 3 (2026-10-18)

**Portão:** lint, typecheck, Vitest, build e Playwright verdes (todos os E2E do convite, layout, design system e orçamento).
Screenshots em `docs/qa/fase-3/`.

**Lighthouse mobile — portão NÃO atingido nesta máquina.** Mediana de 5 rodadas (código final):
Performance **72** (rodadas: 60, 74, 72, 53, 76), Acessibilidade **100**, Boas Práticas **96**, SEO **100**, CLS **0**.
Relatório em `docs/qa/fase-3/lighthouse-mobile-mediana.html`. Boas Práticas perde só pelos 404 de prefetch das rotas
das Fases 4–6 e do favicon (Fase 7).
- O que foi feito pela nota: nomes e assinatura em contornos (sem esperar fonte), Pinyon fora, fontes variáveis
  (7 → 4 arquivos), sprite do monograma, toasts carregados depois da hidratação, revelação do herói sem opacidade,
  camada da abertura que não bloqueia a pintura, orçamento no E2E.
- Diagnóstico: o LCP simulado (~4 s) acompanha a rede do 4G simulado e o JavaScript base do Next/React (~170 KB);
  o TBT oscila com a CPU desta máquina. Com a CPU a 2× o LCP não melhorou, então não é só CPU.
- **Discordância registrada:** ≥ 95 em Performance com Next.js App Router + React pode não ser alcançável sem
  abrir mão de interatividade (contagem, barra, toasts). A verificação real é no PageSpeed Insights (PENDENCIAS T3).

**Revisão adversarial** (2 lentes + verificadores): 16 achados confirmados, 4 descartados. Corrigidos:
herói cobrindo rostos e mãos entre 768–1023px (alta); recorte sem a aliança (agora as duas mãos com a aliança dele) e
ampliação excessiva no desktop (faixa contida + textura assumida); barra inferior piscando sobre o herói no primeiro
quadro; dígitos e indicador de rolagem animando com movimento reduzido; CTA principal apagada sobre a foto; ritmo
monótono de títulos (variantes "discreto" e "lateral", filete avulso removido); frase do RSVP quebrada pelo
placeholder; "SEGUNDOS" colado no divisor; download do .ics no Safari/iOS; salto de layout no estado do dia;
leitura instável do relógio; agenda errada no modo de dois cards (agora uma só, fora dos cards); foco perdido ao abrir
o mapa; screenshots e decisões desatualizados. Também foi pego na revisão visual (antes dela) um monograma cortado pelo
`<use>` do sprite — hoje coberto por teste de geometria.

---

## Fase 4 — `/presentear` e `/confirmar-presente/[id]`

### O que vai ser feito
1. `/presentear`: cabeçalho curto; **as três cotas como três planos** (empilhadas no celular, lado a lado a partir de
   768px, Ouro elevada e com o filete mais presente), cada uma com seu ícone; chips de faixa de valor; linha
   "Prefere outro valor? Fale com a gente" → WhatsApp; área de presentes nomeados (1/2/3 colunas) que só aparece
   quando houver algum; estado "já presenteado" lido de `presentes_reservados` (no servidor).
2. `/confirmar-presente/[id]`: resumo com o valor em destaque; **QR do PIX gerado na hora** (no navegador, carregado
   sob demanda); código copia-e-cola selecionável com fade; **Copiar código PIX** com o check dourado e o flash de
   champanhe (3.5.4) e toast; **Enviar comprovante** (`wa.me` com presente, valor e espaço para o nome); passo a passo
   em três linhas; "Escolher outro presente"; `generateStaticParams`; id inválido → 404.
3. `lib/whatsapp.ts` (links do WhatsApp, puro e testado).

### Decisões
| # | Decisão | Motivo |
|---|---------|--------|
| P1 | O payload PIX é calculado no servidor (função pura de `lib/pix.ts`) e só o QR é desenhado no navegador. | O código fica no HTML desde o primeiro quadro (copiável mesmo antes do JS); o QR, que pesa, chega depois (briefing 8). |
| P2 | Nada é "reservado" ao presentear uma cota (V2). O estado "já presenteado" existe e é lido do banco, mas só se aplica a presentes nomeados — hoje não há nenhum. | Cotas não se esgotam. |
| P3 | Chips de faixa: "Todos", "Até R$ 200", "Acima de R$ 200" — derivados dos valores do config. | O briefing pede o filtro; com três cotas, faixas fixas seriam inventadas. |
| P4 | O "Copiar" usa `motion` (animação `layout` pedida na 3.5.4), carregado só nesta página. | O resto do site não paga esse peso. |
| P5 | Id de presente inexistente é barrado no `src/proxy.ts` (reescreve para uma rota que não existe → 404 do site). A lista de presentes foi para `src/config/presentes.ts`, reexportada por `casamento.ts`. | Com pré-renderização parcial, `notFound()` dentro da página chegava depois da casca já enviada com 200 ("404 suave"). O proxy decide antes de renderizar; o módulo separado evita que ele importe a foto. Continua havendo uma fonte única. |

### Fora do escopo
- Rota `POST /api/presentes/[id]/reservar` e demais Route Handlers: Fase 5 (briefing).

### Fechamento da Fase 4 (2026-10-18)
- Gate: format, lint, typecheck, unitários (dois fusos), build e 193 E2E nos três tamanhos — verdes.
- Screenshots: `docs/qa/fase-4/` (`/presentear` e `/confirmar-presente/ouro` em 390, 768 e 1440).
- Testado de ponta a ponta: escolher a Cota Ouro → copiar o código (área de transferência lida de volta) → link do
  WhatsApp com presente, valor e "Meu nome: "; QR desenhado na tela lido com jsqr = código copia-e-cola; payload com
  CRC válido, valor, chave em +55, recebedora e txid; 404 real para id inexistente; axe nas duas rotas.
- Revisão visual: no celular o código copia-e-cola mostra só a primeira linha com fade (de propósito — o botão é a
  ação; o código inteiro está no DOM e selecionável).
- Ficou de fora: Route Handlers (Fase 5); presentes nomeados (não há nenhum no config — a grade só aparece quando houver).

---

## Fase 5 — `/confirmar-presenca`, `/agradecimento` e as Route Handlers

### O que foi feito
1. **Route Handlers** (seção 5), finas em `src/app/api/*` sobre funções puras em `src/lib/api/` (testáveis sem subir o
   Next): `POST /api/rsvp`, `POST /api/rsvp/verificar`, `GET /api/presentes`, `POST /api/presentes/[id]/reservar`,
   `POST /api/entrar`, `POST /api/sair`, `GET /api/convidados`.
2. Testes obrigatórios contra o `db/schema.sql` real no pg-mem (`src/lib/api/api.test.ts`): anônimo grava RSVP válido;
   payload inválido → 400 sem gravar e sem ecoar o que chegou; `/api/convidados` sem sessão, com cookie forjado,
   assinado com outro segredo, malformado ou vencido → 401 sem dado; `verificar` devolve exatamente
   `{ jaConfirmou, em? }` (nem telefone, nem nome, nem hash). Guardas estáticas: só `api/convidados` lê a lista, e
   toda rota de API existente está listada no teste.
3. `/confirmar-presenca`: três passos com progresso em filete dourado, `react-hook-form` + o mesmo esquema zod do
   servidor, validação no `onBlur`, máscara de telefone, aviso "Você já confirmou em dd/mm", stepper de
   acompanhantes, "Quem convidou?" com toque nos nomes dos noivos ou digitação (datalist), recado com contador,
   honeypot, limite por `sessionStorage`, "Tentar de novo" em falha de rede. Foco vai para o título de cada passo.
4. `/agradecimento`: "Obrigado, {primeiro nome}!", confete dourado só em CSS, os dois caminhos e a agenda; para
   "não poderei ir", texto caloroso sem confete.

### Decisões
| # | Decisão | Motivo |
|---|---------|--------|
| R1 | `atualiza_de` recebe o `telefone_hash` quando já havia resposta daquele telefone; `null` na primeira. | O briefing diz "hash da resposta que esta substitui"; as respostas de uma pessoa são identificadas pelo hash do telefone, e vale sempre a mais recente. Nunca há `update`. |
| R2 | Limites por IP, em memória por instância: RSVP 3/min (briefing), verificar 10/min, reservar 10/min, entrar 5/min. IP = primeiro item do `x-forwarded-for` (preenchido pela Vercel). | O briefing pede limite em `verificar` sem número; 10 cobre quem corrige o telefone algumas vezes e impede varrer números. O login tem a senha como única porta. |
| R3 | Honeypot preenchido responde `{ ok: true }` e não grava. | Não ensinar o robô a desviar. |
| R4 | A URL de `/agradecimento` leva o primeiro nome e, só para quem não vem, `resposta=nao`. O nome passa de novo pelo filtro `primeiroNome` na página. | O briefing pede o texto diferente para "não"; a resposta sim/não não é dado sensível. Nome estranho na URL nunca vira conteúdo (teste). |
| R5 | Agenda em `/agradecimento` só para quem vem. | Não faz sentido convidar para a agenda quem avisou que não vai. |
| R6 | **Acessibilidade (corrigido na hora):** a barra inferior do celular passou de 88% para 95% de opacidade. | Com um botão preto passando por trás, o rótulo em `--fumaca` caía para 4,17:1 (axe pegou no formulário). A 95% o pior caso fica em ~4,9:1. |
| R7 | **Dado pessoal (corrigido na hora):** o botão de envio fica desabilitado até a hidratação, e o formulário tem `method="post"`. | Antes da hidratação o formulário era HTML puro sem `action`: um Enter rápido faria um GET nativo com `?nome=…&telefone=…` — telefone na URL, no histórico e nos logs. Teste confere o HTML do servidor. |
| R8 | `/agradecimento` é pré-carregada quando o convidado chega ao passo 3. | Depois do envio, a troca é imediata; num servidor frio a primeira renderização chegou a 7 s nesta máquina. |
| R9 | Os nomes dos noivos em "Quem convidou?" não tiram o foco do campo anterior no toque (`pointerdown` sem foco). | Revisão visual pegou: o blur mostrava um erro, a página descia entre o toque e a soltura e o toque se perdia. Teste de regressão. |
| R10 | O orçamento de JS da home separa a própria home (≤190 KB) do total com o pré-carregamento das rotas vizinhas (≤260 KB). | Com `/confirmar-presenca` existindo, o roteador pré-carrega o JS do formulário depois da carga, em baixa prioridade — é o que faz o botão abrir na hora. Medir junto confundia peso da home com prefetch. |
| R11 | `GET /api/convidados` devolve a resposta que vale por pessoa (`respostasValendo`), com `atualizada` e sem o hash. | A lista dos noivos (Fase 6) mostra uma linha por pessoa; o hash não serve aos noivos. |
| R12 | Ícone novo da marca, `IconeCarta` (envelope com coração no lacre), para "Não poderei ir". | Cada opção com seu ícone; a taça é do "sim". Desenhado na mesma grade e traço dos demais. |

### Fora do escopo
- Tela `/convidados` (login, lista, filtros, CSV): Fase 6. As rotas que ela usa já existem e estão testadas.

### Fechamento da Fase 5 (2026-10-18)
- Screenshots: `docs/qa/fase-5/` — formulário (passo 1 com o aviso de "já confirmou", passo 2, passo 3) e
  agradecimento (sim e não) em 390, 768 e 1440.
- E2E: caminho feliz (com conferência pela rota dos noivos), "não vou", telefone repetido (grava como atualização),
  falha de rede (requisição abortada, dados mantidos, "Tentar de novo"), teclado do início ao fim, validação no
  blur, limite da sessão, honeypot fora do Tab, HTML do servidor sem envio possível, axe nos três passos e no
  agradecimento, confete ausente com movimento reduzido.

---

## Fase 6 — `/convidados`

### O que foi feito
- **Porta no servidor:** a página lê o cookie e decide entre a tela de login e o painel; o painel busca os dados em
  `GET /api/convidados` (401 sem sessão). A página em si nunca lê a lista. Layout próprio, sem a navegação do
  convidado; `noindex, nofollow`.
- **Login** sóbrio com o monograma; aviso "modo demonstração" com a senha só quando o ambiente é de demonstração
  (`senhaVisivelNoLogin`, com teste de que em produção é sempre `null`).
- **Painel:** três contadores com filete (o número sobe uma vez, só CSS); busca com `useDeferredValue` que ignora
  acento e acha também pelo acompanhante; chips; cartões no celular e tabela no desktop (≥1024px) com cabeçalho
  fixo, zebra em papel, números à direita, ordenação por nome/data e 25 por página; agrupamento com subtotal;
  telefones mascarados até "Mostrar telefones"; CSV; atualização a cada 15 s com a aba visível (e ao voltar a ela);
  estados de carregando (brilho dourado), vazio (ícone de aliança) e erro ("Tentar de novo").
- Lógica pura e testada em `src/lib/convidados.ts` e `src/lib/csv.ts`.

### Decisões
| # | Decisão | Motivo |
|---|---------|--------|
| C1 | "Mostrar telefones" sem PIN. | A seção 6.6 (detalhada) pede o botão como camada de discrição; o "com PIN" aparece só no resumo da Fase 10. Os noivos já entraram com senha — um segundo código seria mais uma coisa para esquecer, sem proteger dado nenhum a mais (o telefone já está no navegador deles). |
| C2 | "Tempo real" = revalidação a cada 15 s com a aba visível. | É o que a 6.6 descreve; o resumo da fase diz "realtime". |
| C3 | O chip "Por quem convidou" liga/desliga o **agrupamento** (com subtotal), em vez de ser mais um filtro. | A 6.6 lista o chip e o agrupamento opcional; um filtro por pessoa repetiria o que os grupos já mostram. |
| C4 | O CSV exporta o que está na tela (busca e filtro aplicados), na ordem atual. Células que começam com `=`, `+`, `-` ou `@` ganham apóstrofo. | Nome e recado vêm de convidados: sem isso, o Excel executaria fórmula (injeção de CSV) no computador dos noivos. |
| C5 | Quem não vem fica no grupo "Quem não vem (não informa)". | O formulário só pergunta "quem convidou" para quem vem (6.4). |
| C6 | Contadores lado a lado já no celular. | Empilhados, ocupavam quase 300 px antes da lista (revisão visual na 390). |
| C7 | Tabela com larguras fixas (`table-layout: fixed`). | Com o agrupamento, cada grupo calculava as próprias colunas e elas desalinhavam (revisão visual). |
| C8 | Higiene: teste novo reprova caractere invisível literal (BOM, espaço inseparável, marca de acento solta) no código. | Pegou um espaço inseparável literal num teste da Fase 4; agora o código usa os escapes. |
| C9 | `await connection()` antes de conferir a validade da sessão na página. | Com `partialPrefetching`, o Next pré-renderiza mesmo depois de `cookies()`, e a hora atual não pode entrar nessa pré-renderização. |

### Fechamento da Fase 6 (2026-10-18)
- Screenshots: `docs/qa/fase-6/` — login, lista e lista agrupada (telefones visíveis) em 390, 768 e 1440.
- E2E: porta sem dado nenhum (e 401 na rota), senha errada, `noindex`, contadores e máscara de telefone, busca
  (sem acento, por acompanhante), chips e agrupamento, CSV (BOM, `;`, só o filtrado), tabela com ordenação no
  desktop, **confirmar presença numa aba → aparece sozinho na lista aberta em outra**, sair, estados vazio e de
  erro, axe na porta e no painel.
