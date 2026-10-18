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
